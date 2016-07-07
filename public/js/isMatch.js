/**
 * isMatch.js
 * 
 * Evan Steinkerchner - 2015
 * https://gist.github.com/Roundaround/87835b53690135aa0529
 * 
 * A string matching function that utilizes a variety of methods to provide 'intelligent'
 * string matching functionality.  A pair of strings will be considered a match when either:
 * 
 * 1. the strings are both phoenetically similar as per the double metaphone algorithm, and
 *     similar/near as per the jaro winkler distance algorithm
 * 2. the strings have a clean/strict (an exact match when stripped down to lower case
 *     alphanumeric characters only), with a required minimum percent length in the query string
 * 
 * The file exports two globally facing identifiers: isMatch(a, b) for checking for matches using the default values,
 * and a Matcher class with the capabilities of adjusting the thresholds for what is considered similar
 * enough distances and lengths for strings to be considered a match.  This class also has a member function isMatch
 * that mirrors the functionality of the lone function and utilizes the passed custom thresholds.
 */

(function (global) {
    'use strict';

    var VOWELS = /[AEIOUY]/, // Match vowels (including `Y`).
        SLAVO_GERMANIC = /W|K|CZ|WITZ/, // Match few Slavo-Germanic values.
        GERMANIC = /^(VAN |VON |SCH)/, // Match few Germanic values.
        INITIAL_EXCEPTIONS = /^(GN|KN|PN|WR|PS)/, // Match initial values of which the first character should be skipped.
        GREEK_INITIAL_CH = /^CH(IA|EM|OR([^E])|YM|ARAC|ARIS)/, // Match initial Greek-like values of which the `CH` sounds like `K`.
        GREEK_CH = /ORCHES|ARCHIT|ORCHID/, // Match Greek-like values of which the `CH` sounds like `K`.
        CH_FOR_KH = /[ BFHLMNRVW]/, // Match values which when following `CH`, transform `CH` to sound like `K`.
        G_FOR_F = /[CGLRT]/, // Match values which when preceding a vowel and `UGH`, sound like `F`.
        INITIAL_G_FOR_KJ = /Y[\s\S]|E[BILPRSY]|I[BELN]/, // Match initial values which sound like either `K` or `J`.
        INITIAL_ANGER_EXCEPTION = /^[DMR]ANGER/, // Match initial values which sound like either `K` or `J`.
        G_FOR_KJ = /[EGIR]/, // Match values which when following `GY`, do not sound like `K` or `J`.
        J_FOR_J_EXCEPTION = /[LTKSNMBZ]/, // Match values which when following `J`, do not sound `J`.
        ALLE = /AS|OS/, // Match values which might sound like `L`.
        H_FOR_S = /EIM|OEK|OLM|OLZ/, // Match Germanic values preceding `SH` which sound like `S`.
        DUTCH_SCH = /E[DMNR]|UY|OO/; // Match Dutch values following `SCH` which sound like either `X` and `SK`, or `SK`.

    function __doubleMetaphone(value) {
        var primary = '',
            secondary = '',
            index = 0,
            length = value.length,
            last = length - 1,
            isSlavoGermanic = SLAVO_GERMANIC.test(value),
            isGermanic = GERMANIC.test(value),
            characters = value.split(''),
            subvalue,
            next,
            prev,
            nextnext;

        value = String(value).toUpperCase() + '     ';

        // Skip this at beginning of word.
        if (INITIAL_EXCEPTIONS.test(value))
            index++;

        // Initial X is pronounced Z, which maps to S. Such as `Xavier`
        if (characters[0] === 'X') {
            primary += 'S';
            secondary += 'S';

            index++;
        }

        while (index < length) {
            prev = characters[index - 1];
            next = characters[index + 1];
            nextnext = characters[index + 2];

            switch (characters[index]) {
                case 'A':
                case 'E':
                case 'I':
                case 'O':
                case 'U':
                case 'Y':
                case 'À':
                case 'Ê':
                case 'É':
                case 'É':
                    if (index === 0) {
                        // All initial vowels now map to `A`.
                        primary += 'A';
                        secondary += 'A';
                    }

                    index++;

                    break;
                case 'B':
                    primary += 'P';
                    secondary += 'P';

                    if (next === 'B')
                        index++;

                    index++;

                    break;
                case 'Ç':
                    primary += 'S';
                    secondary += 'S';
                    index++;

                    break;
                case 'C':
                    // Various Germanic:
                    if (prev === 'A' &&
                        next === 'H' &&
                        nextnext !== 'I' &&
                        !VOWELS.test(characters[index - 2]) &&
                        (nextnext !== 'E' || (subvalue = value.slice(index - 2, index + 4) &&
                            (subvalue === 'BACHER' || subvalue === 'MACHER')))
                        ) {
                        primary += 'K';
                        secondary += 'K';
                        index += 2;

                        break;
                    }

                    // Special case for `Caesar`.
                    if (index === 0 && value.slice(index + 1, index + 6) === 'AESAR') {
                        primary += 'S';
                        secondary += 'S';
                        index += 2;

                        break;
                    }

                    // Italian `Chianti`.
                    if (value.slice(index + 1, index + 4) === 'HIA') {
                        primary += 'K';
                        secondary += 'K';
                        index += 2;

                        break;
                    }

                    if (next === 'H') {
                        // Find `Michael`.
                        if (index > 0 && nextnext === 'A' && characters[index + 3] === 'E') {
                            primary += 'K';
                            secondary += 'X';
                            index += 2;

                            break;
                        }

                        // Greek roots such as `chemistry`, `chorus`.
                        if (index === 0 && GREEK_INITIAL_CH.test(value)) {
                            primary += 'K';
                            secondary += 'K';
                            index += 2;

                            break;
                        }

                        // Germanic, Greek, or otherwise `CH` for `KH` sound.
                        if (isGermanic ||
                            // Such as 'architect' but not 'arch', orchestra', 'orchid'.
                            GREEK_CH.test(value.slice(index - 2, index + 4)) ||
                            (nextnext === 'T' || nextnext === 'S') ||
                            ((index === 0 ||
                                prev === 'A' ||
                                prev === 'E' ||
                                prev === 'O' ||
                                prev === 'U') &&
                            // Such as `wachtler`, `weschsler`, but not `tichner`.
                                CH_FOR_KH.test(nextnext))
                            ) {
                            primary += 'K';
                            secondary += 'K';
                        } else if (index === 0) {
                            primary += 'X';
                            secondary += 'X';
                        } else if (value.slice(0, 2) === 'MC') { // Such as 'McHugh'.
                            // Bug? Why matching absolute? what about McHiccup?
                            primary += 'K';
                            secondary += 'K';
                        } else {
                            primary += 'X';
                            secondary += 'K';
                        }

                        index += 2;

                        break;
                    }

                    // Such as `Czerny`.
                    if (next === 'Z' && value.slice(index - 2, index) !== 'WI') {
                        primary += 'S';
                        secondary += 'X';
                        index += 2;

                        break;
                    }

                    // Such as `Focaccia`.
                    if (value.slice(index + 1, index + 4) === 'CIA') {
                        primary += 'X';
                        secondary += 'X';
                        index += 3;

                        break;
                    }

                    // Double `C`, but not `McClellan`.
                    if (next === 'C' && !(index === 1 && characters[0] === 'M')) {
                        // Such as `Bellocchio`, but not `Bacchus`.
                        if ((nextnext === 'I' ||
                            nextnext === 'E' ||
                            nextnext === 'H') &&
                            value.slice(index + 2, index + 4) !== 'HU'
                            ) {
                            subvalue = value.slice(index - 1, index + 4);

                            // Such as `Accident`, `Accede`, `Succeed`.
                            if ((index === 1 && prev === 'A') || subvalue === 'UCCEE' || subvalue === 'UCCES') {
                                primary += 'KS';
                                secondary += 'KS';
                            } else { // Such as `Bacci`, `Bertucci`, other Italian.
                                primary += 'X';
                                secondary += 'X';
                            }

                            index += 3;

                            break;
                        } else {
                            // Pierce's rule.
                            primary += 'K';
                            secondary += 'K';
                            index += 2;

                            break;
                        }
                    }

                    if (next === 'G' || next === 'K' || next === 'Q') {
                        primary += 'K';
                        secondary += 'K';
                        index += 2;

                        break;
                    }

                    // Italian.
                    if (next === 'I' && (nextnext === 'A' || nextnext === 'E' || nextnext === 'O')) {
                        primary += 'S';
                        secondary += 'X';
                        index += 2;

                        break;
                    }

                    if (next === 'I' || next === 'E' || next === 'Y') {
                        primary += 'S';
                        secondary += 'S';
                        index += 2;

                        break;
                    }

                    primary += 'K';
                    secondary += 'K';

                    // Skip two extra characters ahead in `Mac Caffrey`, `Mac Gregor`.
                    if (next === ' ' && (nextnext === 'C' || nextnext === 'G' || nextnext === 'Q')) {
                        index += 3;
                        break;
                    }

                    if (next === 'K' || next === 'Q' || (next === 'C' && nextnext !== 'E' && nextnext !== 'I'))
                        index++;

                    index++;

                    break;
                case 'D':
                    if (next === 'G') {
                        // Such as `edge`.
                        if (nextnext === 'E' || nextnext === 'I' || nextnext === 'Y') {
                            primary += 'J';
                            secondary += 'J';
                            index += 3;
                        } else { // Such as `Edgar`.
                            primary += 'TK';
                            secondary += 'TK';
                            index += 2;
                        }

                        break;
                    }

                    if (next === 'T' || next === 'D') {
                        primary += 'T';
                        secondary += 'T';
                        index += 2;

                        break;
                    }

                    primary += 'T';
                    secondary += 'T';
                    index++;

                    break;
                case 'F':
                    if (next === 'F')
                        index++;

                    index++;
                    primary += 'F';
                    secondary += 'F';

                    break;
                case 'G':
                    if (next === 'H') {
                        if (index > 0 && !VOWELS.test(prev)) {
                            primary += 'K';
                            secondary += 'K';
                            index += 2;

                            break;
                        }

                        // Such as `Ghislane`, `Ghiradelli`.
                        if (index === 0) {
                            if (nextnext === 'I') {
                                primary += 'J';
                                secondary += 'J';
                            } else {
                                primary += 'K';
                                secondary += 'K';
                            }
                            index += 2;
                            break;
                        }

                        // Parker's rule (with some further refinements).
                        if ((// Such as `Hugh`
                            subvalue = characters[index - 2],
                            subvalue === 'B' ||
                            subvalue === 'H' ||
                            subvalue === 'D'
                            ) ||
                            (// Such as `bough`.
                                subvalue = characters[index - 3],
                                subvalue === 'B' ||
                                subvalue === 'H' ||
                                subvalue === 'D'
                                ) ||
                            (// Such as `Broughton`.
                                subvalue = characters[index - 4],
                                subvalue === 'B' ||
                                subvalue === 'H'
                                )
                            ) {
                            index += 2;

                            break;
                        }

                        // Such as `laugh`, `McLaughlin`, `cough`, `gough`, `rough`, `tough`.
                        if (index > 2 && prev === 'U' && G_FOR_F.test(characters[index - 3])) {
                            primary += 'F';
                            secondary += 'F';
                        } else if (index > 0 && prev !== 'I') {
                            primary += 'K';
                            secondary += 'K';
                        }

                        index += 2;

                        break;
                    }

                    if (next === 'N') {
                        if (index === 1 && VOWELS.test(characters[0]) && !isSlavoGermanic) {
                            primary += 'KN';
                            secondary += 'N';
                        } else if (
                            // Not like `Cagney`.
                            value.slice(index + 2, index + 4) !== 'EY' &&
                            value.slice(index + 1) !== 'Y' &&
                            !isSlavoGermanic
                            ) {
                            primary += 'N';
                            secondary += 'KN';
                        } else {
                            primary += 'KN';
                            secondary += 'KN';
                        }

                        index += 2;

                        break;
                    }

                    //Such as `Tagliaro`.
                    if (value.slice(index + 1, index + 3) === 'LI' && !isSlavoGermanic) {
                        primary += 'KL';
                        secondary += 'L';
                        index += 2;

                        break;
                    }

                    // -ges-, -gep-, -gel- at beginning.
                    if (index === 0 && INITIAL_G_FOR_KJ.test(value.slice(1, 3))) {
                        primary += 'K';
                        secondary += 'J';
                        index += 2;

                        break;
                    }

                    // -ger-, -gy-.
                    if ((value.slice(index + 1, index + 3) === 'ER' &&
                        prev !== 'I' && prev !== 'E' &&
                        !INITIAL_ANGER_EXCEPTION.test(value.slice(0, 6))
                        ) ||
                        (next === 'Y' && !G_FOR_KJ.test(prev))
                        ) {
                        primary += 'K';
                        secondary += 'J';
                        index += 2;

                        break;
                    }

                    // Italian such as `biaggi`.
                    if (next === 'E' || next === 'I' || next === 'Y' || (
                        (prev === 'A' || prev === 'O') &&
                        next === 'G' && nextnext === 'I'
                        )
                        ) {
                        // Obvious Germanic.
                        if (value.slice(index + 1, index + 3) === 'ET' || isGermanic) {
                            primary += 'K';
                            secondary += 'K';
                        } else {
                            // Always soft if French ending.
                            if (value.slice(index + 1, index + 5) === 'IER ') {
                                primary += 'J';
                                secondary += 'J';
                            } else {
                                primary += 'J';
                                secondary += 'K';
                            }
                        }

                        index += 2;

                        break;
                    }

                    if (next === 'G')
                        index++;

                    index++;

                    primary += 'K';
                    secondary += 'K';

                    break;
                case 'H':
                    // Only keep if first & before vowel or btw. 2 vowels.
                    if (VOWELS.test(next) && (index === 0 || VOWELS.test(prev))) {
                        primary += 'H';
                        secondary += 'H';

                        index++;
                    }

                    index++;

                    break;
                case 'J':
                    // Obvious Spanish, `jose`, `San Jacinto`.
                    if (value.slice(index, index + 4) === 'JOSE' || value.slice(0, 4) === 'SAN ') {
                        if (value.slice(0, 4) === 'SAN ' || (index === 0 && characters[index + 4] === ' ')) {
                            primary += 'H';
                            secondary += 'H';
                        } else {
                            primary += 'J';
                            secondary += 'H';
                        }

                        index++;

                        break;
                    }

                    if (index === 0) {
                        // Such as `Yankelovich` or `Jankelowicz`.
                        primary += 'J';
                        secondary += 'A';
                    } else if (// Spanish pron. of such as `bajador`.
                        !isSlavoGermanic &&
                        (next === 'A' || next === 'O') &&
                        VOWELS.test(prev)
                        ) {
                        primary += 'J';
                        secondary += 'H';
                    } else if (index === last) {
                        primary += 'J';
                    } else if (prev !== 'S' && prev !== 'K' && prev !== 'L' && !J_FOR_J_EXCEPTION.test(next)) {
                        primary += 'J';
                        secondary += 'J';
                    } else if (next === 'J') {
                        index++;
                    }

                    index++;

                    break;
                case 'K':
                    if (next === 'K')
                        index++;

                    primary += 'K';
                    secondary += 'K';
                    index++;

                    break;
                case 'L':
                    if (next === 'L') {
                        // Spanish such as `cabrillo`, `gallegos`.
                        if ((index === length - 3 && ((
                            prev === 'I' && (
                                nextnext === 'O' || nextnext === 'A'
                                )
                            ) || (
                                prev === 'A' && nextnext === 'E'
                                )
                            )) || (
                                prev === 'A' && nextnext === 'E' && ((
                                    characters[last] === 'A' || characters[last] === 'O'
                                    ) || ALLE.test(value.slice(last - 1, length))
                                    )
                                )
                            ) {
                            primary += 'L';
                            index += 2;

                            break;
                        }

                        index++;
                    }

                    primary += 'L';
                    secondary += 'L';
                    index++;

                    break;
                case 'M':
                    // Such as `dumb`, `thumb`.
                    if (next === 'M' || (
                        prev === 'U' && next === 'B' && (
                            index + 1 === last || value.slice(index + 2, index + 4) === 'ER')
                        )
                        ) {
                        index++;
                    }

                    index++;
                    primary += 'M';
                    secondary += 'M';

                    break;
                case 'N':
                    if (next === 'N')
                        index++;

                    index++;
                    primary += 'N';
                    secondary += 'N';

                    break;
                case 'Ñ':
                    index++;
                    primary += 'N';
                    secondary += 'N';

                    break;
                case 'P':
                    if (next === 'H') {
                        primary += 'F';
                        secondary += 'F';
                        index += 2;

                        break;
                    }

                    // Also account for `campbell` and `raspberry`.
                    subvalue = next;

                    if (subvalue === 'P' || subvalue === 'B')
                        index++;

                    index++;

                    primary += 'P';
                    secondary += 'P';

                    break;
                case 'Q':
                    if (next === 'Q') {
                        index++;
                    }

                    index++;
                    primary += 'K';
                    secondary += 'K';

                    break;
                case 'R':
                    // French such as `Rogier`, but exclude `Hochmeier`.
                    if (index === last &&
                        !isSlavoGermanic &&
                        prev === 'E' &&
                        characters[index - 2] === 'I' &&
                        characters[index - 4] !== 'M' && (
                            characters[index - 3] !== 'E' &&
                            characters[index - 3] !== 'A'
                            )
                        ) {
                        secondary += 'R';
                    } else {
                        primary += 'R';
                        secondary += 'R';
                    }

                    if (next === 'R')
                        index++;

                    index++;

                    break;
                case 'S':
                    // Special cases `island`, `isle`, `carlisle`, `carlysle`.
                    if (next === 'L' && (prev === 'I' || prev === 'Y')) {
                        index++;

                        break;
                    }

                    // Special case `sugar-`.
                    if (index === 0 && value.slice(1, 5) === 'UGAR') {
                        primary += 'X';
                        secondary += 'S';
                        index++;

                        break;
                    }

                    if (next === 'H') {
                        // Germanic.
                        if (H_FOR_S.test(value.slice(index + 1, index + 5))) {
                            primary += 'S';
                            secondary += 'S';
                        } else {
                            primary += 'X';
                            secondary += 'X';
                        }

                        index += 2;
                        break;
                    }

                    if (next === 'I' && (nextnext === 'O' || nextnext === 'A')) {
                        if (!isSlavoGermanic) {
                            primary += 'S';
                            secondary += 'X';
                        } else {
                            primary += 'S';
                            secondary += 'S';
                        }

                        index += 3;

                        break;
                    }

                    /*
                     * German & Anglicization's, such as `Smith` match `Schmidt`,
                     * `snider` match `Schneider`. Also, -sz- in slavic language
                     * although in hungarian it is pronounced `s`.
                     */
                    if (next === 'Z' || (
                        index === 0 && (
                            next === 'L' || next === 'M' || next === 'N' || next === 'W'
                            )
                        )
                        ) {
                        primary += 'S';
                        secondary += 'X';

                        if (next === 'Z')
                            index++;

                        index++;

                        break;
                    }

                    if (next === 'C') {
                        // Schlesinger's rule.
                        if (nextnext === 'H') {
                            subvalue = value.slice(index + 3, index + 5);

                            // Dutch origin, such as `school`, `schooner`.
                            if (DUTCH_SCH.test(subvalue)) {
                                // Such as `schermerhorn`, `schenker`.
                                if (subvalue === 'ER' || subvalue === 'EN') {
                                    primary += 'X';
                                    secondary += 'SK';
                                } else {
                                    primary += 'SK';
                                    secondary += 'SK';
                                }

                                index += 3;

                                break;
                            }

                            if (index === 0 && !VOWELS.test(characters[3]) && characters[3] !== 'W') {
                                primary += 'X';
                                secondary += 'S';
                            } else {
                                primary += 'X';
                                secondary += 'X';
                            }

                            index += 3;

                            break;
                        }

                        if (nextnext === 'I' || nextnext === 'E' || nextnext === 'Y') {
                            primary += 'S';
                            secondary += 'S';
                            index += 3;
                            break;
                        }

                        primary += 'SK';
                        secondary += 'SK';
                        index += 3;

                        break;
                    }

                    subvalue = value.slice(index - 2, index);

                    // French such as `resnais`, `artois`.
                    if (index === last && (subvalue === 'AI' || subvalue === 'OI')) {
                        secondary += 'S';
                    } else {
                        primary += 'S';
                        secondary += 'S';
                    }

                    if (next === 'S' || next === 'Z')
                        index++;

                    index++;

                    break;
                case 'T':
                    if (next === 'I' && nextnext === 'O' && characters[index + 3] === 'N') {
                        primary += 'X';
                        secondary += 'X';
                        index += 3;

                        break;
                    }

                    subvalue = value.slice(index + 1, index + 3);

                    if ((next === 'I' && nextnext === 'A') || (next === 'C' && nextnext === 'H')) {
                        primary += 'X';
                        secondary += 'X';
                        index += 3;

                        break;
                    }

                    if (next === 'H' || (next === 'T' && nextnext === 'H')) {
                        // Special case `Thomas`, `Thames` or Germanic.
                        if (isGermanic || ((nextnext === 'O' || nextnext === 'A') && characters[index + 3] === 'M')) {
                            primary += 'T';
                            secondary += 'T';
                        } else {
                            primary += '0';
                            secondary += 'T';
                        }

                        index += 2;

                        break;
                    }

                    if (next === 'T' || next === 'D')
                        index++;

                    index++;
                    primary += 'T';
                    secondary += 'T';

                    break;
                case 'V':
                    if (next === 'V')
                        index++;

                    primary += 'F';
                    secondary += 'F';
                    index++;

                    break;
                case 'W':
                    // Can also be in middle of word (as already taken care of for initial).
                    if (next === 'R') {
                        primary += 'R';
                        secondary += 'R';
                        index += 2;

                        break;
                    }

                    if (index === 0) {
                        // `Wasserman` should match `Vasserman`.
                        if (VOWELS.test(next)) {
                            primary += 'A';
                            secondary += 'F';
                        } else if (next === 'H') {
                            // Need `Uomo` to match `Womo`.
                            primary += 'A';
                            secondary += 'A';
                        }
                    }

                    // `Arnow` should match `Arnoff`.
                    if (((prev === 'E' || prev === 'O') &&
                        next === 'S' && nextnext === 'K' && (
                            characters[index + 3] === 'I' ||
                            characters[index + 3] === 'Y'
                            )
                        ) || value.slice(0, 3) === 'SCH' || (index === last && VOWELS.test(prev))
                        ) {
                        secondary += 'F';
                        index++;

                        break;
                    }

                    // Polish such as `Filipowicz`.
                    if (next === 'I' && (nextnext === 'C' || nextnext === 'T') && characters[index + 3] === 'Z') {
                        primary += 'TS';
                        secondary += 'FX';
                        index += 4;

                        break;
                    }

                    index++;

                    break;
                case 'X':
                    // French such as `breaux`.
                    if (index === last || (prev === 'U' && (
                        characters[index - 2] === 'A' ||
                        characters[index - 2] === 'O'
                        ))
                        ) {
                        primary += 'KS';
                        secondary += 'KS';
                    }

                    if (next === 'C' || next === 'X')
                        index++;

                    index++;

                    break;
                case 'Z':
                    // Chinese pinyin such as `Zhao`.
                    if (next === 'H') {
                        primary += 'J';
                        secondary += 'J';
                        index += 2;

                        break;
                    } else if ((next === 'Z' && (
                        nextnext === 'A' || nextnext === 'I' || nextnext === 'O'
                        )) || (
                            isSlavoGermanic && index > 0 && prev !== 'T'
                            )
                        ) {
                        primary += 'S';
                        secondary += 'TS';
                    } else {
                        primary += 'S';
                        secondary += 'S';
                    }

                    if (next === 'Z')
                        index++;

                    index++;

                    break;
                default:
                    index++;

            }
        }

        return [primary, secondary];
    }

    function __phoeneticallySimilar(a, b) {
        var one = __doubleMetaphone(a),
            two = __doubleMetaphone(b);

        return one[0] == two[0] || one[1] == two[0] || one[0] == two[1] || one[1] == two[2];
    }

    function __extend(a, b) {
        for (var property in b) {
            if (b.hasOwnProperty(property)) {
                a[property] = b[property];
            }
        }

        return a;
    }

    function __jaroWinklerDistance(s1, s2, options) {
        var m = 0,
            defaults = { caseSensitive: true },
            settings = __extend(defaults, options),
            i,
            j;

        // Exit early if either are empty.
        if (s1.length === 0 || s2.length === 0)
            return 0;

        // Convert to upper if case-sensitive is false.
        if (!settings.caseSensitive) {
            s1 = s1.toUpperCase();
            s2 = s2.toUpperCase();
        }

        // Exit early if they're an exact match.
        if (s1 === s2)
            return 1;

        var range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
            s1Matches = new Array(s1.length),
            s2Matches = new Array(s2.length);

        for (i = 0; i < s1.length; i++) {
            var low = (i >= range) ? i - range : 0,
                high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

            for (j = low; j <= high; j++) {
                if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
                    ++m;
                    s1Matches[i] = s2Matches[j] = true;
                    break;
                }
            }
        }

        // Exit early if no matches were found.
        if (m === 0)
            return 0;

        // Count the transpositions.
        var k = 0,
            numTrans = 0;

        for (i = 0; i < s1.length; i++) {
            if (s1Matches[i] === true) {
                for (j = k; j < s2.length; j++) {
                    if (s2Matches[j] === true) {
                        k = j + 1;
                        break;
                    }
                }

                if (s1[i] !== s2[j])
                    ++numTrans;
            }
        }

        var weight = (m / s1.length + m / s2.length + (m - (numTrans / 2)) / m) / 3,
            l = 0,
            p = 0.1;

        if (weight > 0.7) {
            while (s1[l] === s2[l] && l < 4)
                ++l;

            weight = weight + l * p * (1 - weight);
        }

        return weight;
    }

    function __nearDistance(a, b, minDistance, splitBySpaces) {
        return __jaroWinklerDistance(a, b, { caseSensitive: false }) >= minDistance;
    }

    function __isFuzzyMatch(a, b, minDistance, splitBySpaces) {
        return __phoeneticallySimilar(a, b, splitBySpaces) && __nearDistance(a, b, minDistance, splitBySpaces);
    }

    function __clean(a) {
        if (!a || typeof a !== 'string')
            return a;

        return a.trim().toLowerCase().replace(/\W/g, '');
    }

    function __hasCleanMatch(a, b) {
        if (!a || typeof a !== 'string' || !b || typeof b !== 'string')
            return false;

        var cleanedStr = __clean(a),
            cleanedQuery = __clean(b);

        if (!cleanedStr.length || !cleanedQuery.length) return false;
        return cleanedStr.indexOf(cleanedQuery) > -1;
    }

    function __isStrictMatch(a, b, startsMinLength, cleanMinLength) {
        var pl = __percentLength(a, b);
        return (__hasCleanMatch(a, b) && pl >= cleanMinLength) || (__startsCleanlyWith(a, b) && pl >= startsMinLength);
    }

    function __percentLength(a, b) {
        if (!a || typeof a !== 'string' || !b || typeof b !== 'string')
            return 0;

        if (!a.length)
            return 1;

        return b.length / a.length;
    }

    function __startsWith(a, b, pos) {
        pos = pos || 0;
        return a.indexOf(b, pos) === pos;
    }

    function __startsCleanlyWith(a, b) {
        return __startsWith(__clean(a), __clean(b));
    }

    function __isMatch(a, b, startsMinLength, cleanMinLength, minDistance, splitBySpaces) {
        return __isStrictMatch(a, b, startsMinLength, cleanMinLength) || __isFuzzyMatch(a, b, minDistance, splitBySpaces);
    }

    function isMatch(a, b) {
        return __isMatch(a, b, 0.25, 0.5, 0.75, false);
    }


    /**
     * Matcher Class
     */
    function Matcher(opts) {
        if (!opts || typeof opts !== 'object')
            opts = {};

        this.startsMinLength = opts.startsMinLength || 0.25;
        this.cleanMinLength = opts.cleanMinLength || 0.5;
        this.minDistance = opts.minDistance || 0.75;
        this.splitBySpaces = opts.splitBySpaces || false;
    }

    Matcher.prototype.setStartsMinLength = function (startsMinLength) {
        this.startsMinLength = startsMinLength;
    };

    Matcher.prototype.setCleanMinLength = function (cleanMinLength) {
        this.cleanMinLength = cleanMinLength;
    };

    Matcher.prototype.setMinDistance = function (minDistance) {
        this.minDistance = minDistance;
    };

    Matcher.prototype.setSplitBySpaces = function (splitBySpaces) {
        this.splitBySpaces = splitBySpaces;
    };

    Matcher.prototype.setOptions = function (opts) {
        if (!opts || typeof opts !== 'object')
            opts = {};

        if (opts.startsMinLength || opts.startsMinLength === 0)
            this.startsMinLength = opts.startsMinLength;
        if (opts.cleanMinLength || opts.cleanMinLength === 0)
            this.cleanMinLength = opts.cleanMinLength;
        if (opts.minDistance || opts.minDistance === 0)
            this.minDistance = opts.minDistance;
        if (opts.splitBySpaces !== undefined)
            this.splitBySpaces = opts.splitBySpaces;
    };

    Matcher.prototype.isMatch = function (a, b) {
        return __isMatch(a, b, this.startsMinLength, this.cleanMinLength, this.minDistance, this.splitBySpaces);
    };


    if (typeof define === 'function' && define.amd) {
        define([], isMatch);
        define([], Matcher);
    } else if (typeof exports === 'object') {
        module.exports = {
            isMatch: isMatch,
            Matcher: Matcher
        };
    } else {
        global.isMatch = isMatch;
        global.Matcher = Matcher;
    }

})(this);