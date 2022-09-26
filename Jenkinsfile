pipeline {
    agent any
    tools {nodejs "nodejs-v11"}
    environment {
        IMAGE_VERSION = "v_${BUILD_NUMBER}"
        DOCKER_IMAGE_TAG_REMOTE = "127.0.0.1:8129/xcalibyte/xcal.rule-service";
    }
    stages {
        stage('pull') {
            steps {
                echo '========= pull =========='
                git credentialsId: 'github_xxuser', branch: 'master', url: 'https://github.com/xcalcc/rule-service.git'
            }
        }
        stage('build') {
            steps {
                echo '========= build =========='
                script {
                    commitTime = getFormattedCommitTime()
                    shortCommitHash = getShortCommitHash()
                    IMAGE_VERSION = commitTime + "." + shortCommitHash
                    echo "${IMAGE_VERSION}"
                    //sh 'npm config set registry https://registry.npm.taobao.org'
                    //sh 'npm i cnpm -g'
                    //sh 'cnpm i'
                    //sh 'npm run build'
                    //sh 'cd /home/xc5/dev_deploy/rule-service'
                    sh 'cp .env.default .env'
                    withCredentials([usernamePassword(credentialsId: 'harbor_xxuser', passwordVariable: 'password', usernameVariable:'user')]) {
                        sh """
                        docker build -t $DOCKER_IMAGE_TAG_REMOTE:${IMAGE_VERSION} -f Dockerfile .
                        docker login -u $user -p $password 127.0.0.1:8129
                        docker tag $DOCKER_IMAGE_TAG_REMOTE:${IMAGE_VERSION} $DOCKER_IMAGE_TAG_REMOTE:latest
                        docker push $DOCKER_IMAGE_TAG_REMOTE:latest
                        docker push $DOCKER_IMAGE_TAG_REMOTE:$IMAGE_VERSION
                        """
                    }
                }

            }
        }
        stage('deploy') {
            steps {
                echo '======= deploy ======='
                script {
                    sshPublisher(
                      continueOnError: false,
                      failOnError: true,
                      publishers: [
                        sshPublisherDesc(
                          configName: "aliyun_jenkins_host",
                          verbose: true,
                          transfers: [
                            sshTransfer(
                              execCommand: "cd /home/xc5/dev_deploy/rule-service && docker pull $DOCKER_IMAGE_TAG_REMOTE:latest && sh restart.sh"
                            )
                          ])
                      ])
                }
                sleep 5
                script{
                    try{
                        build job: 'xcalscan-deploy', propagate: true, wait: false
                    }
                    catch (err){
                        unstable('Calling next job failed, job: xcalscan-deploy, set result to unstable')
                        echo "Error caught: ${err}"
                    }
                }
            }
        }
    }
}

def getShortCommitHash() {
    return sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()
}

def getCommitTime() {
    return sh(returnStdout: true, script: "git log -1 | grep ^Date: |awk '{\$1=\"\"; \$NF=\"\"; print}'").trim()
}

def getFormattedCommitTime() {
    def commitTime = getCommitTime()
    return sh(returnStdout: true, script: "date --date=\"${commitTime}\" '+%Y%m%d-%H%M%S'").trim()
}
