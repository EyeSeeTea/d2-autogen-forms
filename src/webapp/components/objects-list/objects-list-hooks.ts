import {
    ObjectsTableDetailField,
    PaginationOptions,
    ReferenceObject,
    TableColumn,
    TablePagination,
    TableSorting,
    TableState,
} from "@eyeseetea/d2-ui-components";
import React from "react";
import { ObjectsListProps } from "./ObjectsList";

export interface TableConfig<Obj extends ReferenceObject> {
    columns: TableColumn<Obj>[];
    paginationOptions: PaginationOptions;
    initialSorting: TableSorting<Obj>;
    details?: ObjectsTableDetailField<Obj>[];
}

type GetRows<Obj extends ReferenceObject> = (
    paging: TablePagination,
    sorting: TableSorting<Obj>
) => Promise<{ objects: Obj[]; pager?: Partial<TablePagination> } | undefined>;

const initialPagination: TablePagination = { page: 1, pageSize: 20, total: 0 };

export function useObjectsTable<Obj extends ReferenceObject>(
    config: TableConfig<Obj>,
    getRows: GetRows<Obj>
): ObjectsListProps<Obj> {
    const [rows, setRows] = React.useState<Obj[]>([]);
    const [pagination, setPagination] = React.useState<Partial<TablePagination>>(initialPagination);
    const [sorting, setSorting] = React.useState<TableSorting<Obj>>(config.initialSorting);
    const [isLoading, setLoading] = React.useState(true);

    const loadRows = React.useCallback(
        async (sorting: TableSorting<Obj>, paginationOptions: Partial<TablePagination>) => {
            setLoading(true);
            const paging = { ...initialPagination, ...paginationOptions };
            const res = await getRows(paging, sorting);

            if (res) {
                setRows(res.objects);
                setPagination({ ...paginationOptions, ...res.pager });
            } else {
                setRows([]);
                setPagination(initialPagination);
            }

            setSorting(sorting);
            setLoading(false);
        },
        [getRows]
    );

    React.useEffect(() => {
        loadRows(sorting, { ...initialPagination, page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadRows]);

    const onChange = React.useCallback(
        (newState: TableState<Obj>) => {
            const { pagination, sorting } = newState;
            // TODO: Here we should set states sorting/pagination and remove them from within loadRows.
            loadRows(sorting, pagination);
        },
        [loadRows]
    );

    return { ...config, isLoading, rows, onChange, pagination };
}
