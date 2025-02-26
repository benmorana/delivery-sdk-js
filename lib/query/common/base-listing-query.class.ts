import { IDeliveryClientConfig } from '../../config';
import {
    continuationTokenHeaderName,
    Filters,
    IGroupedNetworkResponse,
    IKontentListAllResponse,
    IKontentListResponse,
    IDeliveryNetworkResponse,
    IListAllQueryConfig,
    IQueryConfig,
    Parameters,
    SortOrder
} from '../../models';
import { QueryService } from '../../services';
import { BaseQuery } from './base-query.class';

export abstract class BaseListingQuery<
    TResponse extends IKontentListResponse,
    TAllResponse extends IKontentListAllResponse,
    TQueryConfig extends IQueryConfig,
    TContract
> extends BaseQuery<TResponse, TQueryConfig, TContract> {

    constructor(protected config: IDeliveryClientConfig, protected queryService: QueryService) {
        super(config, queryService);
    }

    /**
     * Empty filter condition
     * @param element Element with empty value
     */
    emptyFilter(element: string): this {
        this.parameters.push(new Filters.EmptyFilter(element));
        return this;
    }

    /**
     * Not empty filter condition
     * @param element Element with non-empty value
     */
    notEmptyFilter(element: string): this {
        this.parameters.push(new Filters.NotEmptyFilter(element));
        return this;
    }

    /**
     * Equals filter condition
     * @param element Element to filter. Example: 'elements.movie'
     * @param value Value to match. Example: 'Kingsman'
     */
    equalsFilter(element: string, value: string): this {
        this.parameters.push(new Filters.EqualsFilter(element, value));
        return this;
    }

    /**
     * Not equals filter condition
     * @param element Element to filter. Example: 'elements.movie'
     * @param value Value to match. Example: 'Kingsman'
     */
    notEqualsFilter(element: string, value: string): this {
        this.parameters.push(new Filters.NotEqualsFilter(element, value));
        return this;
    }

    /**
     * All filter
     * @param element Element to filter.
     * @param values Values
     */
    allFilter(element: string, values: string[]): this {
        this.parameters.push(new Filters.AllFilter(element, values));
        return this;
    }

    /**
     * Any filter
     * @param element Element to filter.
     * @param values Values
     */
    anyFilter(element: string, values: string[]): this {
        this.parameters.push(new Filters.AnyFilter(element, values));
        return this;
    }

    /**
     * Contains filter
     * @param element Element to filter.
     * @param values Values
     */
    containsFilter(element: string, values: string[]): this {
        this.parameters.push(new Filters.ContainsFilter(element, values));
        return this;
    }

    /**
     * Greater then filter
     * @param element Element to filter.
     * @param value Value
     */
    greaterThanFilter(element: string, value: string): this {
        this.parameters.push(new Filters.GreaterThanFilter(element, value));
        return this;
    }

    /**
     * Greater then or equals filter
     * @param element Element to filter.
     * @param value Value
     */
    greaterThanOrEqualFilter(element: string, value: string): this {
        this.parameters.push(new Filters.GreaterThanOrEqualFilter(element, value));
        return this;
    }

    /**
     * In filter
     * @param element Element to filter.
     * @param values Values
     */
    inFilter(element: string, values: string[]): this {
        this.parameters.push(new Filters.InFilter(element, values));
        return this;
    }

    /**
     * Not in filter
     * @param element Element to filter.
     * @param values Values
     */
    notInFilter(element: string, values: string[]): this {
        this.parameters.push(new Filters.NotInFilter(element, values));
        return this;
    }

    /**
     * Less then filter
     * @param element Element to filter.
     * @param value Value
     */
    lessThanFilter(element: string, value: string): this {
        this.parameters.push(new Filters.LessThanFilter(element, value));
        return this;
    }

    /**
     * @param element Element to filter.
     * @param value Value
     */
    lessThanOrEqualFilter(element: string, value: string): this {
        this.parameters.push(new Filters.LessThanOrEqualFilter(element, value));
        return this;
    }

    /**
     * @param element Element to filter.
     * @param lowerValue Lower value of range (e.g. 2)
     * @param higherValue Higher value of range (e.g. 10)
     */
    rangeFilter(element: string, lowerValue: number, higherValue: number): this {
        this.parameters.push(new Filters.RangeFilter(element, lowerValue, higherValue));
        return this;
    }

    /**
     * Limits the number of items returned by query
     * @param limit Number of items to load
     */
    limitParameter(limit: number): this {
        this.parameters.push(new Parameters.LimitParameter(limit));
        return this;
    }

    /**
     * Orders query based on given element and sort order
     * @param element Element by which to order
     * @param sortOrder Asc/Desc order type
     */
    orderParameter(element: string, sortOrder: SortOrder): this {
        this.parameters.push(new Parameters.OrderParameter(element, sortOrder));
        return this;
    }

    /**
     * Sets descending order on given element
     * @param element Element by which to order
     */
    orderByDescending(element: string): this {
        this.parameters.push(new Parameters.OrderParameter(element, 'desc'));
        return this;
    }

    /**
     * Sets Ascending order on given element
     * @param element Element by which to order
     */
    orderByAscending(element: string): this {
        this.parameters.push(new Parameters.OrderParameter(element, 'asc'));
        return this;
    }

    /**
     * Skips the selected number of items
     * @param skip Number of items to skip
     */
    skipParameter(skip: number): this {
        this.parameters.push(new Parameters.SkipParameter(skip));
        return this;
    }

    /**
     * Sets continuation token header
     */
    withContinuationToken(token: string): this {
        // remove previous continuation token if there is any
        let queryHeaders = this._queryConfig.customHeaders ?? [];
        queryHeaders = queryHeaders.filter(m => m.header !== continuationTokenHeaderName);

        this._queryConfig.customHeaders = queryHeaders;

        this.withHeaders([
            {
                header: continuationTokenHeaderName,
                value: token
            }
        ]);

        return this;
    }

    /**
     * Query to get all items. Uses paging data and may execute multiple HTTP requests depending on number of items
     */
    toAllPromise(queryAllConfig?: IListAllQueryConfig<TResponse, TContract>): Promise<IGroupedNetworkResponse<TAllResponse>> {
        return this.queryService.getListAllResponse<TResponse, TAllResponse, TContract>({
            page: 1,
            listQueryConfig: queryAllConfig,
            allResponseFactory: (items, responses) => {
                const response = this.allResponseFactory(items, responses);
                return {
                    data: response,
                    responses: responses
                };
            },
            getResponse: (nextPageUrl, continuationToken) => {
                let query = this;

                if (nextPageUrl) {
                    query = this.withCustomUrl(nextPageUrl);
                }
                if (continuationToken) {
                    query = this.withContinuationToken(continuationToken);
                }

                return query.toPromise();
            }
        });
    }

    protected abstract allResponseFactory(items: any[], responses: IDeliveryNetworkResponse<TResponse, TContract>[]): TAllResponse;
}
