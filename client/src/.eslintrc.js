module.exports = {
	env: {
		es6: true,
		browser: true,
	},
	rules: {
		"no-console": "off",

		"@typescript-eslint/explicit-module-boundary-types": "off",
	},
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		ecmaFeatures: {
			modules: true,
		},
	},
	overrides: [
		{
			files: ["*.vue"],
			parser: "vue-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
				ecmaVersion: 2020,
				sourceType: "module",
				ecmaFeatures: {
					legacyDecorators: true,
				},
			},
			plugins: ["vue"],
			extends: ["plugin:vue/vue3-essential"], // "plugin:vue/vue3-strongly-recommended"
			rules: {
				"vue/attribute-hyphenation": ["error", "always"],
				"vue/html-self-closing": [
					"error",
					{
						html: {
							void: "any",
							normal: "never",
							component: "always",
						},
						svg: "always",
					},
				],
				"vue/mustache-interpolation-spacing": ["error", "always"],
				"vue/no-multi-spaces": [
					"warn",
					{
						ignoreProperties: false,
					},
				],
				"vue/no-v-html": "error",
				"vue/v-bind-style": ["error", "shorthand"],
				"vue/v-on-style": ["error", "shorthand"],
				"vue/multi-word-component-names": "off",
				"vue/no-multiple-template-root": "off",
			},
		},
		{
			files: ["*.ts", "*.tsx"],
			parser: "@typescript-eslint/parser",
			parserOptions: {
				project: ["./tsconfig.json"],
				ecmaFeatures: {
					legacyDecorators: true,
				},
			},
			rules: {
				"@typescript-eslint/restrict-template-expressions": [
					"warn",
					{ allowNumber: true, allowBoolean: true },
				],
			},
		},
	],
};
