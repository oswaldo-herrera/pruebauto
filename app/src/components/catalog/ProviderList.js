import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class ProviderList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
                limit: 500,
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}general/providers/`,{
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
        if(window.confirm("¿Desea eliminar '"+row.name+"' de proveedores?")){
            axios.delete(`${ApiUrl}general/providers/${row.id}/`)
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
                            <th width={"20%"}>Propiedades</th>
                            <th width={"18%"} onClick={(e)=> this.onColumnClick("name")}>Nombre {this.sortTable("name")}</th>
                            <th width={"14%"} onClick={(e)=> this.onColumnClick("city")}>Ciudad/Estado{this.sortTable("city")}</th>
                            <th width={"10%"} onClick={(e)=> this.onColumnClick("sap_code")}>Código SAP{this.sortTable("sap_code")}</th>
                            <th width={"8%"} onClick={(e)=> this.onColumnClick("currency")}>Moneda{this.sortTable("currency")}</th>
                            <th width={"15%"}>Tipo Cambio</th>
                            <th width={"5%"} onClick={(e)=> this.onColumnClick("active")}>Activo{this.sortTable("active")}</th>
                            <th width={"10%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{row.properties_data.map((property) => (property.name+","))}</td>
                                <td>{row.name}</td>
                                <td>{row.city}</td>
                                <td>{row.sap_code}</td>
                                <td>{row.currency}</td>
                                <td>T/C USD <b>{row.usd_currency?row.usd_currency:0}</b> T/C Euro <b>{row.euro_currency?row.euro_currency:0}</b></td>
                                <td>{row.active?"Si":"No"}</td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        <Link to={`/catalogs/provider/${row.id}`}>
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
    return <ProviderList {...props} history={history} />;
}