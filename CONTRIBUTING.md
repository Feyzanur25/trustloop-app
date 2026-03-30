# Contributing to TrustLoop

We welcome contributions from the community! This guide explains how to contribute code, documentation, and feedback.

## Code of Conduct

- Be respectful and inclusive
- Focus on the code, not the person
- Provide constructive feedback
- Help others learn and grow

## Getting Started

### Fork & Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/trustloop-app.git
cd trustloop-app

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/trustloop-app.git
```

### Install Dependencies

```bash
# Install API dependencies
cd api
npm install

# Install web dependencies
cd ../web
npm install
```

### Start Development

```bash
# Terminal 1: MongoDB
docker run -d -p 27017:27017 mongo:7.0

# Terminal 2: API
cd api && npm run dev

# Terminal 3: Web
cd web && npm run dev
```

Visit http://localhost:5174

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update main branch
git fetch upstream
git rebase upstream/main

# Create feature branch
git checkout -b feat/your-feature-name
```

Branch naming conventions:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions
- `ci/` - CI/CD changes

### 2. Make Changes

**Code Style:**
- Use ESLint (configured in project)
- Use Prettier for formatting
- Follow existing code patterns
- Write meaningful comments
- Keep functions small and focused

**Commit Messages:**
```
feat: Add multi-party approval workflow

- Implement dual-signature requirement
- Add approval status visualization
- Update close flow with gating logic
- Add tests for approval scenarios

Fixes #123
```

Format: `<type>: <subject>` + blank line + `<body>`

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests (if available)
npm test

# Manual testing
# - Test the feature in browser
# - Test on mobile
# - Test error scenarios
```

### 4. Push & Create Pull Request

```bash
# Push to your fork
git push origin feat/your-feature-name

# Create PR on GitHub
# - Reference issues: "Fixes #123"
# - Describe changes clearly
# - Add screenshots if UI change
- List any breaking changes
```

## Pull Request Guidelines

**Good PR:**
- Separate concerns (one feature per PR)
- Includes tests where applicable
- Updates documentation
- Passes CI/CD checks
- Responsive to feedback

**PR Title Format:**
- `feat: Add (feature name)` for new features
- `fix: Resolve (bug description)` for bug fixes
- `docs: Update (section name)` for documentation

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
How to test these changes:
1. ...
2. ...

## Screenshots (if applicable)
[Include screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

## Key Areas for Contribution

### Backend (`api/`)
- API endpoints and routes
- Database models and validation
- Error handling and logging
- Stellar integration improvements
- Performance optimizations

### Frontend (`web/`)
- React components
- User interface improvements
- Accessibility enhancements
- Mobile responsiveness
- Animation and UX

### Documentation
- API documentation
- User guides
- Architecture docs
- Deployment guides
- Code comments

### DevOps
- Docker configuration
- CI/CD pipelines
- Monitoring setup
- Performance optimization

## Reporting Bugs

Use the [Bug Report Template](TESTING.md#bug-reporting-template)

**Before creating an issue:**
1. Check existing issues for duplicates
2. Test on latest main branch
3. Gather error logs and screenshots
4. Try to isolate the problem

## Feature Requests

**Before proposing:**
1. Check existing issues and pull requests
2. Consider alignment with project goals
3. Discuss with maintainers

**Proposal Format:**
```markdown
## Feature: [Name]

**Problem:**
What problem does this solve?

**Solution:**
How would you solve it?

**Alternatives:**
Other approaches considered?

**Additional Context:**
Screenshots, links, research?
```

## Documentation Contributions

- Update docs/ files with clear, concise language
- Include code examples where helpful
- Add diagrams for complex concepts
- Keep technical level appropriate
- Update table of contents

## Performance Optimization

If optimizing code:
- Provide before/after benchmarks
- Test on slow devices/networks
- Document the optimization
- Consider mobile performance
- Profile memory usage

## Security Contributions

For security issues:
1. **DO NOT** create a public issue
2. Email maintainers privately
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Review Process

1. **Author** opens PR
2. **Maintainers** review code
3. **CI/CD** runs automated checks
4. **Author** addresses feedback
5. **Approver** approves PR
6. **Merge** to main branch
7. **Release** in next version

## Commit History

We maintain clean commit history:

```bash
# Before pushing, squash unnecessary commits
git rebase -i HEAD~3

# Force push after rebase (only on your branch!)
git push origin branch-name --force-with-lease
```

## Release Process

1. Create release branch: `git checkout -b release/v1.2.0`
2. Update version in package.json
3. Update CHANGELOG.md
4. Create PR for review
5. Tag release: `git tag v1.2.0`
6. Push to main
7. Create GitHub release with notes

## Learning Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter API](https://github.com/stellar/js-stellar-sdk)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)

## Getting Help

- **Questions:** Open a Discussion on GitHub
- **Issues:** Search existing issues first
- **Chat:** Join our Discord (link in README)
- **Docs:** Check [docs/](./docs/) folder

## Contributor License Agreement

By contributing, you agree that your contributions will be licensed under the project's license.

---

**Thank you for contributing to TrustLoop! 🚀**
