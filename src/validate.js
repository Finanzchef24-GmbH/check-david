'use strict';

const semver = require('semver');

/**
 * @param {string} name
 * @param {string} stable
 * @param {string} requiredRange
 * @param {boolean=} mustBePinned
 * @return {?Object}
 */
function validateRange(name, stable, requiredRange, mustBePinned) {
    if (mustBePinned) {
        return {
            part: null,
            message: `Version for module "${name}" is not pinned`
        };
    } else if (!semver.satisfies(stable, requiredRange)) {
        return {
            part: null,
            message: `Latest version for module "${name}" is out of range "${requiredRange}"`
        };
    } else {
        return null;
    }
}

/**
 * Check if the dependency with the given name, stable and required version needs to be updated and generate the
 * appropriate warning or error message.
 *
 * @private
 * @param {string} name The name of the dependency.
 * @param {string} stableStr The latest stable version available.
 * @param {string} requiredStr The required version as specified in the package.json.
 * @param {boolean=} mustBePinned If set, the required version must be pinned.
 * @return {?Object} A message object or null.
 */
module.exports = function validate(name, stableStr, requiredStr, mustBePinned) {
    const stable = semver.valid(stableStr);
    const required = semver.valid(requiredStr);
    const range = semver.validRange(requiredStr);

    if (!required) {
        if (range) {
            return validateRange(name, stable, range, mustBePinned);
        }

        // David has incomplete support for alternative syntaxes, e.g. "git@github.com:...", see
        // https://github.com/alanshaw/david/issues/92
        return {
            part: null,
            message: `Unparsable semver string for module "${name}": "${requiredStr}"`
        };
    }

    /**
     * @param {string} part
     * @return {?{part: string, message: string}}
     */
    function getMessage(part) {
        const parts = {
            stable: semver[part](stableStr),
            required: semver[part](requiredStr)
        };

        if (parts.stable > parts.required) {
            return {
                part,
                message: `New ${part} version available for module "${name}" (${stableStr})`
            };
        }

        return null;
    }

    return getMessage('major') || getMessage('minor') || getMessage('patch') || null;
};
