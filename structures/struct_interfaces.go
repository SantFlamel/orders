package structures

import "database/sql"

type Orders interface {
    Insert(qm *QueryMessage) (int64, error)
    ReadRow(row *sql.Row) error
    ReadRows(rows *sql.Rows) error
    ReturnValues()[]interface{}
}