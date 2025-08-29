pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds() }

  environment {
    REGISTRY = 'docker.io'
    IMAGE    = 'zabalini/todo-app'
  }

  // -------------- CI ---------------
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git --version && docker --version && docker compose version'
      }
    }

    stage('Calculate Version (Trunk)') {
      steps {
        script {
          def exact = sh(script: "git describe --tags --exact-match 2>/dev/null || true", returnStdout: true).trim()
          def sha   = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
          env.APP_VERSION = exact ? exact : "v0.0.${env.BUILD_NUMBER}-${sha}"
          echo "Version to build: ${env.APP_VERSION}"
        }
      }
    }

    stage('Build with Docker Compose') {
      steps {
        sh '''
          set -e
          docker compose -f docker-compose.yml build app
          APP_IMG_ID=$(docker compose -f docker-compose.yml images --quiet app)
          docker tag "$APP_IMG_ID" ${REGISTRY}/${IMAGE}:${APP_VERSION}
          docker tag ${REGISTRY}/${IMAGE}:${APP_VERSION} ${REGISTRY}/${IMAGE}:latest

          echo "Built and tagged:"
          docker images ${REGISTRY}/${IMAGE} --format "table {{.Repository}}\\t{{.Tag}}\\t{{.ID}}\\t{{.CreatedSince}}"
        '''
      }
    }

    stage('Smoke test (compose + curl container)') {
      steps {
        sh '''
          set -e
          export COMPOSE_PROJECT_NAME=todoapp_ci
          docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d db app nginx
          docker compose -f docker-compose.yml -f docker-compose.ci.yml run --rm curl
          docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v
        '''
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'DOCKERHUB', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            set -e
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin ${REGISTRY}
            docker push ${REGISTRY}/${IMAGE}:${APP_VERSION}
            docker push ${REGISTRY}/${IMAGE}:latest
            docker logout || true
          '''
        }
      }
    }

    // -------------- CD ------------------
    stage('Deploy on VM') {
      when { branch 'main' }          
      agent { label 'deploy' }       
      steps {
        checkout scm           
        withCredentials([
          usernamePassword(credentialsId: 'DOCKERHUB', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS'),
          string(credentialsId: 'APP_MYSQL_USER',     variable: 'CRED_MYSQL_USER'),
          string(credentialsId: 'APP_MYSQL_PASSWORD', variable: 'CRED_MYSQL_PASS'),
          string(credentialsId: 'APP_MYSQL_ROOT',     variable: 'CRED_MYSQL_ROOT'),
          string(credentialsId: 'APP_NODE_ENV',       variable: 'CRED_NODE_ENV'),
          string(credentialsId: 'APP_PORT',           variable: 'CRED_PORT'),
          string(credentialsId: 'APP_PERSISTENCE',    variable: 'CRED_PERSISTENCE'),
          string(credentialsId: 'APP_IMAGE_NAME',     variable: 'CRED_APP_IMAGE')
        ]) {
          sh '''
            set -eu

            if [ ! -f docker-compose.prod.yml ]; then
              cat > docker-compose.prod.yml <<'EOFPROD'
            services:
              nginx:
                ports: ["80:80"]
            EOFPROD
            fi

            umask 077
            cat > .env <<EOF
            APP_IMAGE=${CRED_APP_IMAGE}
            NODE_ENV=${CRED_NODE_ENV}
            PORT=${CRED_PORT}
            PERSISTENCE=${CRED_PERSISTENCE}
            MYSQL_HOST=db
            MYSQL_USER=${CRED_MYSQL_USER}
            MYSQL_PASSWORD=${CRED_MYSQL_PASS}
            MYSQL_DATABASE=tododb
            MYSQL_ROOT_PASSWORD=${CRED_MYSQL_ROOT}
            EOF
            chmod 600 .env

            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin ${REGISTRY}
            docker compose -f docker-compose.yml -f docker-compose.prod.yml pull app || true
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps app nginx

            docker image prune -f || true
            docker logout || true
          '''
        }
      }
    }

    stage('Live check') {
      when { branch 'main' }
      agent { label 'deploy' }
      steps {
        sh 'curl -fsS --retry 20 --retry-delay 2 http://localhost/'
      }
    }
  }

  post {
    always {
      echo "Pipeline finished (status: ${currentBuild.currentResult})"
    }
  }
}
