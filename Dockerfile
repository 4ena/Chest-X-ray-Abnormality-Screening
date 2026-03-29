# --------------------------------------------------------------------
  #SETUP
# --------------------------------------------------------------------
FROM ubuntu:latest
USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
  apt-utils \
  sudo \
  curl \
  git \
  wget \
  unzip \
  build-essential \
  ca-certificates \
  vim \
  software-properties-common \
  && apt-get clean && rm -rf /var/lib/apt/lists/*


RUN add-apt-repository ppa:deadsnakes/ppa && sudo apt update && apt-get install python3.14 -y


