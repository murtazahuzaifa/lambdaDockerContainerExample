# From alpine as serverEnv

# RUN apk add --update nodejs nodejs-npm
# COPY server.js /src


#Adding base image
# FROM public.ecr.aws/lambda/nodejs:12

# # Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12
# COPY app.js package*.json server.js file.txt /

# # WORKDIR /var/task/

# # Install NPM dependencies for function
# RUN npm install
# # RUN nohup node server.js > output.log & npm install
# # npm install forever

# # Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
# CMD [ "app.handler" ]




# ARG FUNCTION_DIR="mnt/content"
ARG FUNCTION_DIR="function"

FROM node:12-buster as build-image

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Install aws-lambda-cpp build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# Copy function code
RUN mkdir -p ${FUNCTION_DIR}
COPY app.js package*.json server.js grafana ${FUNCTION_DIR}/

WORKDIR /${FUNCTION_DIR}

# If the dependency is not in package.json uncomment the following line
RUN npm install && npm install aws-lambda-ric

# Grab a fresh slim copy of the image to reduce the final size
FROM node:12-buster 
# node:12-buster-slim
# RUN apt-get update && apt-get install -y curl procps

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Set working directory to function root directory
RUN mkdir -p ${FUNCTION_DIR}
WORKDIR /${FUNCTION_DIR}

# Copy in the built dependencies
COPY --from=build-image /${FUNCTION_DIR} /${FUNCTION_DIR}

ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]
CMD ["app.handler"]



##############################################

# FROM grafana/grafana:latest-ubuntu

# ARG FUNCTION_DIR
# WORKDIR /${FUNCTION_DIR}

# USER root

# # Set DEBIAN_FRONTEND=noninteractive in environment at build-time
# ARG DEBIAN_FRONTEND=noninteractive

# ARG GF_INSTALL_IMAGE_RENDERER_PLUGIN="false"

# ARG GF_GID="0"
# ENV GF_PATHS_PLUGINS="/var/lib/grafana-plugins"

# RUN mkdir -p "$GF_PATHS_PLUGINS" && \
#     chown -R grafana:${GF_GID} "$GF_PATHS_PLUGINS"

# RUN if [ $GF_INSTALL_IMAGE_RENDERER_PLUGIN = "true" ]; then \
#     apt-get update && \
#     apt-get upgrade -y && \
#     apt-get install -y gdebi-core && \
#     cd /tmp && \
#     curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
#     gdebi --n google-chrome-stable_current_amd64.deb && \
#     apt-get autoremove -y && \
#     rm -rf /var/lib/apt/lists/*; \
# fi

# USER grafana

# ENV GF_RENDERER_PLUGIN_CHROME_BIN="/usr/bin/google-chrome"

# RUN if [ $GF_INSTALL_IMAGE_RENDERER_PLUGIN = "true" ]; then \
#     grafana-cli \
#         --pluginsDir "$GF_PATHS_PLUGINS" \
#         --pluginUrl https://github.com/grafana/grafana-image-renderer/releases/latest/download/plugin-linux-x64-glibc-no-chromium.zip \
#         plugins install grafana-image-renderer; \
# fi

# ARG GF_INSTALL_PLUGINS=""

# RUN if [ ! -z "${GF_INSTALL_PLUGINS}" ]; then \
#     OLDIFS=$IFS; \
#         IFS=','; \
#     for plugin in ${GF_INSTALL_PLUGINS}; do \
#         IFS=$OLDIFS; \
#         grafana-cli --pluginsDir "$GF_PATHS_PLUGINS" plugins install ${plugin}; \
#     done; \
# fi