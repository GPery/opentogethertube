import { Sequelize } from "sequelize-typescript";
import { QueryTypes } from "sequelize";
import { Gauge } from "prom-client";
import { getLogger } from "./logger.js";

const log = getLogger("storage");

/** Source: https://stackoverflow.com/questions/2596670/how-do-you-find-the-row-count-for-all-your-tables-in-postgres */
const POSTGRES_SQL_COLLECT_ALL_TABLE_ROWS = `WITH tbl AS
(SELECT table_schema,
		TABLE_NAME
 FROM information_schema.tables
 WHERE TABLE_NAME not like 'pg_%'
   AND table_schema in ('public'))
SELECT table_schema,
	 TABLE_NAME,
	 (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, TABLE_NAME), FALSE, TRUE, '')))[1]::text::int AS rows_n
FROM tbl
ORDER BY rows_n DESC;`;

export function setupPostgresMetricsCollection(sequelize: Sequelize) {
	const guagePostgresRowCount = new Gauge({
		name: "postgres_db_row_count",
		help: "Number of rows in a table in the database",
		labelNames: ["table"],
		async collect() {
			interface ResultRow {
				table_schema: string;
				table_name: string;
				rows_n: number;
			}

			try {
				const result: ResultRow[] = await sequelize.query(
					POSTGRES_SQL_COLLECT_ALL_TABLE_ROWS,
					{
						type: QueryTypes.SELECT,
					}
				);
				log.debug(`result from query: ${JSON.stringify(result)}`);
				for (const row of result) {
					this.labels({ table: row.table_name }).set(row.rows_n);
				}
			} catch (e) {
				log.error("Failed to collect postgres db row count", e);
			}
		},
	});
}
