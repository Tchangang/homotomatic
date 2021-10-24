// jest.config.js
module.exports = {
    verbose: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    "roots": [
      "<rootDir>/src",
      "<rootDir>/build"
    ],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    "coveragePathIgnorePatterns": [
      "<rootDir>/node_modules",
      // "<rootDir>/src/Usecase/test"
    ],
};
  