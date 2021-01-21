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





ARG FUNCTION_DIR="/function"

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
RUN ls
RUN mkdir -p ${FUNCTION_DIR}
WORKDIR ${FUNCTION_DIR}

RUN ls

# Copy package json
COPY package.*json ${FUNCTION_DIR}

# If the dependency is not in package.json uncomment the following line
# RUN npm install aws-lambda-ric

RUN npm install && npm install aws-lambda-ric

COPY app.js ${FUNCTION_DIR}

FROM node:12-buster-slim
ARG FUNCTION_DIR

# Copy in the built dependencies
COPY --from=build-image ${FUNCTION_DIR} ${FUNCTION_DIR}

ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]
CMD ["app.handler"]