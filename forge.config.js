module.exports = {
    publishers: [
      {
        name: '@electron-forge/publisher-github',
        config: {
          repository: {
            owner: 'olubunmitosin',
            name: 'whatsapp'
          },
          prerelease: false,
          draft: true
        }
      },
      {
        name: '@electron-forge/publisher-snapcraft',
        config: {
          release: '[latest/edge, insider/stable]'
        }
      }
    ]
  }