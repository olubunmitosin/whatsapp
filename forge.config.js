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
      }
    ]
  }