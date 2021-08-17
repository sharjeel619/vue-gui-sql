<template>
  <div id="app">
    <h1 class="text-center m-b-3">GUI SQL Viewer</h1>
    <el-row>
      <el-col :span="6">
        <p><b class="text-primary">From</b> Table:</p>
        <el-select v-model="tableSelect" placeholder="Choose Table..">
          <el-option
            v-for="(item, index) in totalTables"
            :key="`${item.name}-${index}`"
            :label="item.label"
            :value="item.name"
          />
        </el-select>
      </el-col>
      <el-col :span="6">
        <p><b class="text-primary">Select</b> Columns:</p>
        <el-select
          v-model="columnSelect"
          placeholder="Choose Columns.."
          multiple
        >
          <el-option
            v-for="(item, index) in tableColumns"
            :key="`${item}-${index}`"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-col>
      <el-col :span="6">
        <p><b class="text-primary">Where</b> Filter:</p>
        <el-select v-model="filterFieldSelect" placeholder="Choose Column..">
          <el-option
            v-for="(item, index) in filterColumns"
            :key="`${item}-${index}`"
            :label="item"
            :value="item"
          />
        </el-select>
        <el-row type="flex" align="center" class="m-t" v-if="filterFieldSelect">
          <el-col :span="whereFilterColSpan" v-if="whereFilterColSpan === 6">
            <el-select
              v-model="filterCombValue"
              placeholder="Combination"
              size="small"
            >
              <el-option
                v-for="(item, index) in filterCombOperators"
                :key="`${item}-${index}`"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-col>
          <el-col :span="whereFilterColSpan">
            <el-select
              v-model="filterOperatorSelect"
              placeholder="Operator"
              size="small"
            >
              <el-option
                v-for="(item, index) in filterOperands"
                :key="`${item}-${index}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="whereFilterColSpan"
            ><el-input size="small" v-model="filterOperatorValue" />
          </el-col>
          <el-col :span="whereFilterColSpan"
            ><el-button
              type="primary"
              size="small"
              class="m-l"
              @click="addFilters"
              :disabled="disableAddFilterBtn"
              >Add</el-button
            ></el-col
          >
        </el-row>
      </el-col>
      <el-col :span="6">
        <p><b class="text-primary">Order</b> By:</p>
        <el-row>
          <el-col :span="12">
            <el-select v-model="sortColumnSelect" placeholder="Choose column..">
              <el-option
                v-for="(item, index) in filterColumns"
                :key="`${item}-${index}`"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select v-model="sortOrderSelect" placeholder="Order..">
              <el-option
                v-for="(item, index) in sortOrder"
                :key="`${item.label}-${index}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-row type="flex" justify="center">
      <el-col :span="6">
        <el-button
          type="primary"
          @click="executeQuery"
          :disabled="disableExecuteQueryBtn"
          >Execute Query!</el-button
        >
        <json-csv
          v-if="queryResult.length"
          class="el-button el-button--secondary"
          :data="queryResult"
          name="query_result.csv"
        />
      </el-col>
    </el-row>
    <p>SQL Query:</p>
    <h3 v-html="queryString"></h3>
    <el-row type="flex" justify="center">
      <el-col :span="24">
        <el-table :data="queryResult" max-height="500" border>
          <el-table-column
            v-for="[item] in Object.entries(queryResult[0] || {})"
            :key="item"
            :prop="item"
            :label="item"
          />
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import {
  Select,
  Option,
  DatePicker,
  Table,
  TableColumn,
  Tabs,
  TabPane,
  Button,
  Input,
} from "element-ui";
import JsonCSV from "vue-json-csv";
import capitalize from "./filters/capitalize";
import {
  categories,
  customers,
  employee_territories,
  employees,
  order_details,
  orders,
  products,
  regions,
  shippers,
  suppliers,
  territories,
} from "./assets/data/server";
import {
  sortNumberAscending,
  sortNumberDescending,
  sortStringAscending,
  sortStringDescending,
  operatorFunctions,
} from "./util";
export default {
  name: "App",
  filters: {
    capitalize: capitalize,
  },
  components: {
    "el-select": Select,
    "el-option": Option,
    "el-button": Button,
    "el-input": Input,
    "el-table": Table,
    "el-table-column": TableColumn,
    "json-csv": JsonCSV,
  },
  watch: {
    tableSelect(newVal) {
      const fItem = this.totalTables.find((item) => item.name === newVal);
      this.tableColumns = Object.keys(fItem.tableData[0]);
      this.columnSelect = [...this.tableColumns];
      this.filterColumns = [...this.tableColumns];
      this.queryResult = [];
      this.filterValues = [];
      this.filterFieldSelect = "";
      this.sortOrderSelect = "";
      this.sortColumnSelect = "";
    },
  },
  computed: {
    queryString() {
      let str;
      if (this.tableColumns.length) {
        str = this.columnSelect.reduce(
          (acc, item, index, arr) =>
            acc + item + (index !== arr.length - 1 ? ", " : ""),
          "<b class='text-primary'>SELECT</b> "
        );
      }
      if (this.tableSelect) {
        str = `${str} 
        <br/> <b class='text-primary'>FROM</b> ${this.tableSelect}`;
      }
      if (this.filterValues.length) {
        let tempStr = this.filterValues.reduce(
          (acc, item, index, arr) =>
            acc +
            ` ${index ? item.comb : ""} ${item.field} ${item.operator} ${
              item.value
            } `,
          "<br/> <b class='text-primary'>WHERE</b>"
        );
        str = str + tempStr;
      }
      if (this.sortOrderSelect && this.sortColumnSelect) {
        str =
          str +
          `<br/> <b class='text-primary'>ORDER BY </b> ${this.sortColumnSelect} ${this.sortOrderSelect}`;
      }
      return str;
    },
    whereFilterColSpan() {
      return this.filterValues.length > 0 ? 6 : 8;
    },
    disableAddFilterBtn() {
      return this.filterValues.length > 0
        ? !this.filterOperatorSelect ||
            !this.filterOperatorValue ||
            !this.filterCombValue
        : !this.filterOperatorSelect || !this.filterOperatorValue;
    },
    disableExecuteQueryBtn() {
      return !this.tableSelect || !this.columnSelect.length;
    },
  },
  data() {
    return {
      activeTab: "customers",
      tableSelect: "",
      columnSelect: [],
      tableColumns: [],
      filterOperands: [
        { label: "=", value: "===" },
        { label: ">", value: ">" },
        { label: "<", value: "<" },
        { label: ">=", value: ">=" },
        { label: "<=", value: "<=" },
        { label: "!=", value: "!=" },
      ],
      filterCombOperators: ["AND", "OR"],
      filterColumns: [],
      filterFieldSelect: "",
      filterOperatorSelect: "",
      filterOperatorValue: "",
      filterValues: [],
      filterCombValue: "",
      sortOrder: [
        { label: "Ascending", value: "ASC" },
        { label: "Descending", value: "DESC" },
      ],
      sortColumnSelect: "",
      sortOrderSelect: "",
      totalTables: [
        {
          label: "Customers",
          name: "customers",
          tableData: customers,
        },
        {
          label: "Employees",
          name: "employees",
          tableData: employees,
        },
        {
          label: "Orders",
          name: "orders",
          tableData: orders,
        },
        {
          label: "Categories",
          name: "categories",
          tableData: categories,
        },
        { label: "Products", name: "products", tableData: products },
        { label: "Regions", name: "regions", tableData: regions },
        { label: "Suppliers", name: "suppliers", tableData: suppliers },
        { label: "Shippers", name: "shippers", tableData: shippers },
        { label: "Territories", name: "territories", tableData: territories },
      ],
      queryResult: [],
    };
  },
  methods: {
    onTabClick(tab, event) {},
    addFilters() {
      const obj = {
        field: this.filterFieldSelect,
        operator: this.filterOperatorSelect,
        value: this.filterOperatorValue,
        comb: this.filterCombValue,
      };
      // Check for duplicate filter condition
      this.filterValues.push(obj);
      this.filterOperatorSelect = "";
      this.filterOperatorValue = "";
    },
    executeQuery() {
      const fItem = this.totalTables.find(
        (item) => item.name === this.tableSelect
      );
      let tempData = [...fItem.tableData];
      if (this.filterValues.length) {
        tempData = tempData.filter((item) => {
          const qStr = this.filterValues.reduce(
            (acc, { field, operator, value, comb }) => {
              let str = "";
              str = `${comb === "AND" ? " &&" : comb === "OR" ? " ||" : ""}`;
              if (typeof item[field] === "string") {
                str = str + ` "${item[field]}" `;
              } else if (typeof item[field] === "number") {
                str = str + ` ${item[field]} `;
              }
              if (isNaN(Number(value))) {
                str = str + `${operator} "${value}"`;
              } else {
                str = str + `${operator} ${value}`;
              }
              return acc + str;
            },
            ""
          );
          return eval(qStr);
        });
      }
      if (this.sortOrderSelect && this.sortColumnSelect && tempData.length) {
        const columnDataType = tempData[0][this.sortColumnSelect];
        if (typeof columnDataType === "string") {
          if (this.sortOrderSelect === "ASC") {
            tempData.sort((a, b) =>
              sortStringAscending(
                a[this.sortColumnSelect],
                b[this.sortColumnSelect]
              )
            );
          } else if (this.sortOrderSelect === "DESC") {
            tempData.sort((a, b) =>
              sortStringDescending(
                a[this.sortColumnSelect],
                b[this.sortColumnSelect]
              )
            );
          }
        } else if (typeof columnDataType === "number") {
          if (this.sortOrderSelect === "ASC") {
            tempData.sort((a, b) =>
              sortNumberAscending(
                a[this.sortColumnSelect],
                b[this.sortColumnSelect]
              )
            );
          } else if (this.sortOrderSelect === "DESC") {
            tempData.sort((a, b) =>
              sortNumberDescending(
                a[this.sortColumnSelect],
                b[this.sortColumnSelect]
              )
            );
          }
        }
      }
      tempData.forEach((item, index, arr) => {
        let obj = {};
        for (let i = 0; i < this.columnSelect.length; i++) {
          let key = this.columnSelect[i];
          obj[key] = item[key];
        }
        arr[index] = obj;
      });
      this.queryResult = [...tempData];
    },
  },
  beforeMount() {},
  mounted() {},
};
</script>

<style lang="scss">
#app {
  font-family: monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 60px 24px 0 24px;
  .el-row {
    margin-bottom: 24px;
  }
  .el-select {
    width: 90% !important;
  }
}
</style>
