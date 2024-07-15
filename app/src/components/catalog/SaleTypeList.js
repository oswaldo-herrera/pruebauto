import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class SaleTypeList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}general/saletypes/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        let search = this.props.search?this.props.search:"";
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: search
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.search !== this.props.search) {
            this.setState(function (prev_State) {
                return {
                    params: {
                        ...prev_State.params,
                        search: this.props.search
                    },
                };
            });
		}
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.name+"' de tipo de venta?")){
            axios.delete(`${ApiUrl}general/saletypes/${row.id}/`)
                .then(res => {
                    this.refreshList();
                });
        }
    }

    onColumnClick = (field) => {
        if(this.state.params.ordering === field){
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: "-"+field
                    },
                };
            });
        } else {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: field
                    },
                };
            });
        }
    }

    sortTable = (field) => {
        if(this.state.params.ordering !== null){
            switch(this.state.params.ordering){
                case field:
                    return (<i className="bi bi-sort-alpha-down text-right"></i>)
                case "-"+field:
                    return (<i className="bi bi-sort-alpha-up text-right"></i>)
            }
        }
        return (<></>)
    }

    render(){
        const data = this.state.data;
        return(
            <div>
                <p id="before-table"></p>
                <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"12%"}>Propiedad</th>
                            <th width={"16%"} onClick={(e)=> this.onColumnClick("name")}>Nombre {this.sortTable("name")}</th>
                            <th width={"19%"} onClick={(e)=> this.onColumnClick("department_cecos__name")}>Departamento CECOS{this.sortTable("department_cecos__name")}</th>
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("sap_code")}>Código SAP{this.sortTable("sap_code")}</th>
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("warehouse_code")}>Almacen{this.sortTable("warehouse_code")}</th>
                            <th width={"10%"} onClick={(e)=> this.onColumnClick("is_inner_bussiness")}>¿IntDep? {this.sortTable("is_inner_bussiness")}</th>
                            <th width={"13%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{row.property_name}</td>
                                <td>{row.name}</td>
                                <td>{row.department_cecos_name}</td>
                                <td>{row.sap_code}</td>
                                <td>{row.warehouse_code}</td>
                                <td>{row.is_inner_bussiness?"Si":"No"}</td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        <Link to={`/catalogs/saletype/${row.id}`}>
                                            <Button color="info"
                                                size='sm'>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                        </Link>
                                        <Button color="warning" 
                                            size='sm'
                                            onClick={(e)=> this.onDeleteRow(row)}>
                                            <i className="bi bi-trash-fill"></i>
                                        </Button>
                                    </ButtonGroup>
                                </td>
                            </tr>
                        ))} 
                    </tbody>
              </Table>
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <SaleTypeList {...props} history={history} />;
}