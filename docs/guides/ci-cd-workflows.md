# CI/CD Workflows

Automate your deployments with CI/CD pipelines using GitHub Actions, GitLab CI, Jenkins, and more.

## GitHub Actions

```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: deployio/deploy-action@v1
        with:
          api-key: ${{ secrets.DEPLOYIO_API_KEY }}
          environment: production
```

## GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - deployio deploy --env production
  only:
    - main
```

## Automated Testing

```yaml
test:
  runs-tests: true
  quality-gates:
    coverage: 80%
    security: high
```
