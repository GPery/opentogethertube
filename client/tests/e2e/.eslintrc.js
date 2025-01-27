module.exports = {
	plugins: ["cypress"],
	env: {
		"jest": false,
		"mocha": true,
		"cypress/globals": true,
	},
	extends: ["plugin:cypress/recommended"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: ["./tsconfig.json"],
	},
	ignorePatterns: [".eslintrc.js"],
	rules: {
		"strict": "off",
		"jest/expect-expect": "off",
		"@typescript-eslint/restrict-template-expressions": [
			"warn",
			{ allowNumber: true, allowBoolean: true },
		],
	},
};
