import React from 'react'

interface TableProps {
    children: React.ReactNode
    className?: string
}

interface TableHeaderProps {
    children: React.ReactNode
}

interface TableBodyProps {
    children: React.ReactNode
}

interface TableRowProps {
    children: React.ReactNode
    className?: string
}

interface TableHeadProps {
    children: React.ReactNode
    className?: string
}

interface TableCellProps {
    children: React.ReactNode
    className?: string
    colSpan?: number
}

export function Table({ children, className = '' }: TableProps) {
    return (
        <div className="table-container">
            <table className={`table ${className}`}>
                {children}
            </table>
        </div>
    )
}

export function TableHeader({ children }: TableHeaderProps) {
    return <thead>{children}</thead>
}

export function TableBody({ children }: TableBodyProps) {
    return <tbody>{children}</tbody>
}

export function TableRow({ children, className = '' }: TableRowProps) {
    return <tr className={className}>{children}</tr>
}

export function TableHead({ children, className = '' }: TableHeadProps) {
    return <th className={className}>{children}</th>
}

export function TableCell({ children, className = '', colSpan }: TableCellProps) {
    return <td className={className} colSpan={colSpan}>{children}</td>
}
