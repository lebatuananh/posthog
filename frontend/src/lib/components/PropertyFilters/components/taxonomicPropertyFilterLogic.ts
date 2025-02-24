import { kea } from 'kea'
import { TaxonomicPropertyFilterLogicProps } from 'lib/components/PropertyFilters/types'
import { AnyPropertyFilter, CohortPropertyFilter, PropertyOperator, PropertyType } from '~/types'
import type { taxonomicPropertyFilterLogicType } from './taxonomicPropertyFilterLogicType'
import { cohortsModel } from '~/models/cohortsModel'
import { TaxonomicFilterGroup, TaxonomicFilterValue } from 'lib/components/TaxonomicFilter/types'
import {
    isGroupPropertyFilter,
    isPropertyFilterWithOperator,
    propertyFilterTypeToTaxonomicFilterType,
    sanitizePropertyFilter,
    taxonomicFilterTypeToPropertyFilterType,
} from 'lib/components/PropertyFilters/utils'
import { taxonomicFilterLogic } from 'lib/components/TaxonomicFilter/taxonomicFilterLogic'
import { propertyDefinitionsModel } from '~/models/propertyDefinitionsModel'

export const taxonomicPropertyFilterLogic = kea<taxonomicPropertyFilterLogicType>({
    path: (key) => ['lib', 'components', 'PropertyFilters', 'components', 'taxonomicPropertyFilterLogic', key],
    props: {} as TaxonomicPropertyFilterLogicProps,
    key: (props) => `${props.pageKey}-${props.filterIndex}`,

    connect: (props: TaxonomicPropertyFilterLogicProps) => ({
        values: [
            props.propertyFilterLogic,
            ['filters'],
            taxonomicFilterLogic({
                taxonomicFilterLogicKey: props.pageKey,
                taxonomicGroupTypes: props.taxonomicGroupTypes,
                onChange: props.taxonomicOnChange,
                eventNames: props.eventNames,
            }),
            ['taxonomicGroups'],
            propertyDefinitionsModel,
            ['describeProperty'],
        ],
    }),

    actions: {
        selectItem: (taxonomicGroup: TaxonomicFilterGroup, propertyKey?: TaxonomicFilterValue) => ({
            taxonomicGroup,
            propertyKey,
        }),
        openDropdown: true,
        closeDropdown: true,
    },

    reducers: {
        dropdownOpen: [
            false,
            {
                openDropdown: () => true,
                closeDropdown: () => false,
            },
        ],
    },

    selectors: {
        filter: [
            (s) => [s.filters, (_, props) => props.filterIndex],
            (filters, filterIndex): AnyPropertyFilter | null =>
                filters[filterIndex] ? sanitizePropertyFilter(filters[filterIndex]) : null,
        ],
        selectedCohortName: [
            (s) => [s.filter, cohortsModel.selectors.cohorts],
            (filter, cohorts) => (filter?.type === 'cohort' ? cohorts.find((c) => c.id === filter?.value)?.name : null),
        ],
        activeTaxonomicGroup: [
            (s) => [s.filter, s.taxonomicGroups],
            (filter, groups): TaxonomicFilterGroup | undefined => {
                if (isGroupPropertyFilter(filter)) {
                    const taxonomicGroupType = propertyFilterTypeToTaxonomicFilterType(
                        filter.type,
                        filter.group_type_index
                    )
                    return groups.find((group) => group.type === taxonomicGroupType)
                }
            },
        ],
    },

    listeners: ({ actions, values, props }) => ({
        selectItem: ({ taxonomicGroup, propertyKey }) => {
            const propertyType = taxonomicFilterTypeToPropertyFilterType(taxonomicGroup.type)
            if (propertyKey && propertyType) {
                if (propertyType === 'cohort') {
                    const cohortProperty: CohortPropertyFilter = {
                        key: 'id',
                        value: parseInt(String(propertyKey)),
                        type: propertyType,
                    }
                    props.propertyFilterLogic.actions.setFilter(props.filterIndex, cohortProperty)
                } else {
                    const propertyValueType = values.describeProperty(propertyKey)
                    const property_name_to_default_operator_override = {
                        $active_feature_flags: PropertyOperator.IContains,
                    }
                    const property_value_type_to_default_operator_override = {
                        [PropertyType.Duration]: PropertyOperator.GreaterThan,
                        [PropertyType.DateTime]: PropertyOperator.IsDateExact,
                        [PropertyType.Selector]: PropertyOperator.Exact,
                    }
                    const operator =
                        property_name_to_default_operator_override[propertyKey] ||
                        (isPropertyFilterWithOperator(values.filter) ? values.filter.operator : null) ||
                        property_value_type_to_default_operator_override[propertyValueType ?? ''] ||
                        PropertyOperator.Exact

                    const property: AnyPropertyFilter = {
                        key: propertyKey.toString(),
                        value: null,
                        operator,
                        type: propertyType as AnyPropertyFilter['type'] as any, // bad | pipe chain :(
                        group_type_index: taxonomicGroup.groupTypeIndex,
                    }
                    props.propertyFilterLogic.actions.setFilter(props.filterIndex, property)
                }
                actions.closeDropdown()
            }
        },
    }),
})
