pipeline {
  agent {
    label 'physical && virtualbox && vagrant'
  }

  triggers {
    issueCommentTrigger('.*ok to test.*')
    cron('@daily')
  }

  options {
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    VM_CPUS = '4'
    VM_RAM = '4096'
  }

  stages {

    stage('Build') {
      steps {
        sh 'echo hello'
      }
    }
  }

  post {
    cleanup {
      sh 'echo hello'
    }
    always {
      script {
        if (env.CHANGE_ID) {
          pullRequest.comment("Build [${env.BUILD_NUMBER}](${env.BUILD_URL}) completed with status ${currentBuild.currentResult} in ${currentBuild.durationString}")

        }
      }
    }
  }

}
