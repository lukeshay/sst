/// <reference path="./.sst/platform/config.d.ts" />

/**
 * ## AWS Cluster Spot capacity
 *
 * This example, shows how to use the Fargate Spot capacity provider for your services.
 *
 * We have it set to use only Fargate Spot instances for all non-production stages. Learn more
 * about the [`capacity`](/docs/component/aws/cluster#capacity) prop.
 */
export default $config({
  app(input) {
    return {
      name: "aws-cluster-logging-fluentbit-datadog",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("MyVpc");

    const cluster = new sst.aws.Cluster("MyCluster", { vpc });
    new sst.aws.Service("MyService", {
      cluster,
      loadBalancer: {
        ports: [{ listen: "80/http", container: "app" }],
      },
      containers: [
        {
          name: "app",
          image: {
            dockerfile: "./Dockerfile",
          },
          logging: {
            driver: "awsfirelens",
            options: {
              Name: "datadog",
              apikey: "<replace-me>",
              Host: "http-intake.logs.datadoghq.com",
              dd_service: "aws-cluster-logging-fluentbit-datadog",
              dd_source: "aws-cluster-logging-fluentbit-datadog",
              TLS: "on",
              provider: "ecs",
            },
          },
        },
        {
          name: "log-router",
          image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
          firelensConfiguration: {
            type: "fluentbit",
            options: {
              "enable-ecs-log-metadata": "true",
            },
          },
        },
      ],
    });
  },
});
