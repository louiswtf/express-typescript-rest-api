import {extend, validateAll} from 'indicative/validator';
import {getValue, skippable} from 'indicative-utils';
import ValidationException from '../exceptions/ValidationException';
import Knex from 'knex';

export async function validateInput(
    data: Record<string, any>,
    schema: Record<string, any>,
    messages?: Record<string, any>,
    removeAdditional = true,
): Promise<Record<string, any>> {
    try {
        const matched = await validateAll(data, schema, messages, {removeAdditional});
        return matched;
    } catch (errors) {
        throw new ValidationException(errors);
    }
}

export function customValidationRules(knex: Knex): void {
    extend('unique', {
        async: true,
        compile: function (args) {
            if (args.length < 2) {
                throw new Error('Unique rule needs the table and column name');
            }
            return args;
        },
        validate: async function (data, field, args) {
            const fieldValue = getValue(data, field);

            if (skippable(fieldValue, field, {existyStrict: true})) {
                return true;
            }

            const record = await knex(args[0])
                .select()
                .where(args[1], fieldValue)
                .andWhere((builder) => {
                    if (args[2] && args[3]) {
                        builder.whereNot(args[2], args[3]);
                    }
                })
                .first();

            return !record;
        },
    });
}
