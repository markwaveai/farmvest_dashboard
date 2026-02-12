pipeline {
    agent any

    environment {
        // Ensure scripts are executable
        PATH = "${env.WORKSPACE}:${env.PATH}"
    }

    parameters {
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Version number to build')
        string(name: 'TAG_NAME', defaultValue: '', description: 'Git tag name (optional)')
        booleanParam(name: 'DEPLOY_NOW', defaultValue: true, description: 'Trigger build and deploy')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Automation Config') {
            when {
                expression { params.DEPLOY_NOW == true }
            }
            steps {
                script {
                    // Update automation_config.json with Jenkins parameters
                    def configJson = """
                    {
                        "deploy_now": ${params.DEPLOY_NOW},
                        "version": "${params.VERSION}",
                        "tag_name": "${params.TAG_NAME}"
                    }
                    """
                    writeFile file: 'automation_config.json', text: configJson
                    sh "chmod +x automate_deploy.sh web_build.sh"
                }
            }
        }

        stage('Build and Deploy') {
            when {
                expression { params.DEPLOY_NOW == true }
            }
            steps {
                sh './automate_deploy.sh'
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed. Check Jenkins logs for details."
        }
    }
}
