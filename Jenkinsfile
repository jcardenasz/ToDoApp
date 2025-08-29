pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds() }

  environment {
    REGISTRY = "docker.io"
    IMAGE = "zabalini/todo-app"   // must match APP_IMAGE on the deploy VM
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm   // Jenkins automatically clones your repo; no manual 'git pull' needed
        sh 'git --version && docker --version && docker compose version'
      }
    }

    stage('Compute Version (Trunk)') {
      steps {
        script {
          def exact = sh(script: "git describe --tags --exact-match 2>/dev/null || true", returnStdout: true).trim()
          def sha = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
          env.APP_VERSION = exact ? exact : "v0.0.${env.BUILD_NUMBER}-${sha}"
          echo "Version to build: ${env.APP_VERSION}"
        }
      }
    }

    stage('Build with Docker Compose') {
      steps {
        sh '''
          # Build the "app" service defined in docker-compose.yml (uses your Dockerfile)
          docker compose -f docker-compose.yml build app

          # Grab the built image ID for the "app" service
          APP_IMG_ID=$(docker compose -f docker-compose.yml images --quiet app)

          # Tag it with a version and 'latest'
          docker tag "$APP_IMG_ID" ${REGISTRY}/${IMAGE}:${APP_VERSION}
          docker tag ${REGISTRY}/${IMAGE}:${APP_VERSION} ${REGISTRY}/${IMAGE}:latest

          echo "Built and tagged:"
          docker images ${REGISTRY}/${IMAGE} --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}"
        '''
      }
    }
  }
}
