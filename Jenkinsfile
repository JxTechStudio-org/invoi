pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Build') {
      steps {
        echo 'Validating Docker Compose configuration...'
        sh 'docker compose --env-file /run/secrets/invoi.env config >/dev/null'

        echo 'Building application image...'
        sh 'docker compose --env-file /run/secrets/invoi.env build app'
      }
    }

    stage('Test') {
      steps {
        echo 'Running NestJS API integration tests...'
        sh 'docker compose --env-file /run/secrets/invoi.env run --rm --no-deps app npm run test:e2e'
      }
    }

    stage('Deploy') {
      steps {
        echo 'Deploying app and postgres services with Docker Compose...'
        sh 'docker compose --env-file /run/secrets/invoi.env up -d --build app postgres'

        echo 'Verifying Docker Compose services are running...'
        sh '''
          set -eu

          for service in app postgres; do
            container_id="$(docker compose --env-file /run/secrets/invoi.env ps -q "$service")"

            if [ -z "$container_id" ]; then
              echo "Service $service does not have a running container."
              exit 1
            fi

            state="$(docker inspect -f '{{.State.Running}}' "$container_id")"

            if [ "$state" != "true" ]; then
              echo "Service $service is not running."
              docker compose --env-file /run/secrets/invoi.env ps "$service"
              exit 1
            fi
          done
        '''

        echo 'Checking application health inside the app container on port 3000...'
        sh '''
          set -eu

          for attempt in 1 2 3 4 5; do
            if docker compose --env-file /run/secrets/invoi.env exec -T app node -e "
              fetch('http://127.0.0.1:3000/api/health', { signal: AbortSignal.timeout(5000) })
                .then(response => {
                  if (!response.ok) {
                    console.error('Health check returned HTTP ' + response.status);
                    process.exit(1);
                  }
                  console.log('Application health check passed.');
                })
                .catch(error => {
                  console.error(error);
                  process.exit(1);
                });
            "; then
              echo "Health check succeeded on attempt $attempt."
              exit 0
            fi

            if [ "$attempt" -lt 5 ]; then
              echo "Health check attempt $attempt failed; retrying shortly..."
              sleep 3
            fi
          done

          echo 'Health check failed after 5 attempts.'
          exit 1
        '''
      }
    }
  }

  post {
    success {
      echo 'CI/CD pipeline completed successfully.'
    }

    failure {
      echo 'CI/CD pipeline failed. Check the stage logs above for details.'
    }
  }
}
