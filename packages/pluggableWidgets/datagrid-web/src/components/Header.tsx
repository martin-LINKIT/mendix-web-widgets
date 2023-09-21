import {
    createElement,
    Dispatch,
    ReactElement,
    SetStateAction,
    DragEvent,
    DragEventHandler,
    KeyboardEvent,
    useCallback,
    HTMLAttributes,
    ReactNode
} from "react";
import classNames from "classnames";
import { FaLongArrowAltDown } from "./icons/FaLongArrowAltDown";
import { FaLongArrowAltUp } from "./icons/FaLongArrowAltUp";
import { FaArrowsAltV } from "./icons/FaArrowsAltV";
import { GridColumn } from "../typings/GridColumn";
import { ColumnResizerProps } from "./ColumnResizer";
import { SortingRule } from "../features/settings";

export interface HeaderProps {
    className?: string;
    column: GridColumn;
    sortable: boolean;
    resizable: boolean;
    filterable: boolean;
    filterWidget?: ReactNode;
    draggable: boolean;
    dragOver: string;
    hidable: boolean;
    isDragging?: boolean;
    preview?: boolean;
    resizer: ReactElement<ColumnResizerProps>;
    setColumnOrder: (updater: number[]) => void;
    setDragOver: Dispatch<SetStateAction<string>>;
    setIsDragging: Dispatch<SetStateAction<boolean>>;
    setSortBy: Dispatch<SetStateAction<SortingRule[]>>;
    sortBy: SortingRule[];
    visibleColumns: GridColumn[];
    tableId: string;
}

export function Header(props: HeaderProps): ReactElement {
    const canSort = props.sortable && props.column.canSort;
    const canDrag = props.draggable && (props.column.canDrag ?? false);
    const draggableProps = useDraggable(
        canDrag,
        props.visibleColumns,
        props.setColumnOrder,
        props.setDragOver,
        props.setIsDragging
    );

    const [sortProperties] = props.sortBy;
    const isSorted = sortProperties && sortProperties.columnNumber === props.column.columnNumber;
    const isSortedDesc = isSorted && sortProperties.desc;

    const sortIcon = canSort ? (
        isSorted ? (
            isSortedDesc ? (
                <FaLongArrowAltDown />
            ) : (
                <FaLongArrowAltUp />
            )
        ) : (
            <FaArrowsAltV />
        )
    ) : null;

    const caption = props.column.header.trim();

    const onSortBy = (): void => {
        /**
         * Always analyse previous values to predict the next
         * 1 - !isSorted turns to asc
         * 2 - isSortedDesc === false && isSorted turns to desc
         * 3 - isSortedDesc === true && isSorted turns to unsorted
         * If multisort is allowed in the future this should be changed to append instead of just return a new array
         */
        if (!isSorted) {
            props.setSortBy([{ columnNumber: props.column.columnNumber, desc: false }]);
        } else if (isSorted && !isSortedDesc) {
            props.setSortBy([{ columnNumber: props.column.columnNumber, desc: true }]);
        } else {
            props.setSortBy([]);
        }
    };

    const sortProps: HTMLAttributes<HTMLDivElement> = {
        onClick: onSortBy,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSortBy();
            }
        },
        role: "button",
        tabIndex: 0
    };

    return (
        <div
            aria-sort={canSort ? (isSorted ? (isSortedDesc ? "descending" : "ascending") : "none") : undefined}
            className={classNames("th", {
                "hidden-column-preview": props.preview && props.hidable && props.column.hidden
            })}
            role="columnheader"
            style={!props.sortable || !props.column.canSort ? { cursor: "unset" } : undefined}
            title={caption}
        >
            <div
                className={classNames("column-container", {
                    dragging: canDrag && props.column.columnId === props.dragOver
                })}
                id={props.column.columnId}
                {...draggableProps}
            >
                <div
                    className={classNames("column-header", canSort ? "clickable" : "", props.className)}
                    style={{ pointerEvents: props.isDragging ? "none" : undefined }}
                    {...(canSort ? sortProps : undefined)}
                    aria-label={canSort ? "sort " + caption : caption}
                >
                    <span>{caption.length > 0 ? caption : "\u00a0"}</span>
                    {sortIcon}
                </div>
                {props.filterable && props.filterWidget}
            </div>
            {props.resizable && props.column.canResize && props.resizer}
        </div>
    );
}

function useDraggable(
    columnsDraggable: boolean,
    visibleColumns: GridColumn[],
    setColumnOrder: (updater: ((columnOrder: number[]) => number[]) | number[]) => void,
    setDragOver: Dispatch<SetStateAction<string>>,
    setIsDragging: Dispatch<SetStateAction<boolean>>
): {
    draggable?: boolean;
    onDragStart?: DragEventHandler;
    onDragOver?: DragEventHandler;
    onDrop?: DragEventHandler;
    onDragEnter?: DragEventHandler;
    onDragEnd?: DragEventHandler;
} {
    const handleDragStart = useCallback(
        (e: DragEvent<HTMLDivElement>): void => {
            setIsDragging(true);
            const { id: columnId } = e.target as HTMLDivElement;
            e.dataTransfer.setData("colDestination", columnId);
        },
        [setIsDragging]
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
    }, []);

    const handleDragEnter = useCallback(
        (e: DragEvent<HTMLDivElement>): void => {
            const { id: columnId } = e.target as HTMLDivElement;
            const colDestination = e.dataTransfer.getData("colDestination");
            if (columnId !== colDestination) {
                setDragOver(columnId);
            }
        },
        [setDragOver]
    );

    const handleDragEnd = useCallback((): void => {
        setIsDragging(false);
        setDragOver("");
    }, [setDragOver, setIsDragging]);

    const handleOnDrop = useCallback(
        (e: DragEvent<HTMLDivElement>): void => {
            handleDragEnd();
            const { id: colOrigin } = e.target as HTMLDivElement;
            const colDestination = e.dataTransfer.getData("colDestination");

            const toIndex = visibleColumns.findIndex(col => col.columnId === colOrigin);
            const fromIndex = visibleColumns.findIndex(col => col.columnId === colDestination);

            if (toIndex !== fromIndex) {
                const newOrder = [...visibleColumns.map(column => column.columnNumber)];
                const colNum = newOrder[fromIndex];
                newOrder.splice(fromIndex, 1);
                newOrder.splice(toIndex, 0, colNum);
                setColumnOrder(newOrder);
            }
        },
        [handleDragEnd, setColumnOrder, visibleColumns]
    );

    return columnsDraggable
        ? {
              draggable: true,
              onDragStart: handleDragStart,
              onDragOver: handleDragOver,
              onDrop: handleOnDrop,
              onDragEnter: handleDragEnter,
              onDragEnd: handleDragEnd
          }
        : {};
}
