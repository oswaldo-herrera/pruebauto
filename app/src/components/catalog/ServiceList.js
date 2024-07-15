import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ModalServiceFilterListReport from './ModalServiceFilterListReport';
class ServiceList extends Component{
    constructor(props){
        super(props);
        this.handleClose = this.handleClose.bind(this);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
            },
            modal_report:{
                open:false,
                params:{
                    date:"",
                    type:"include_commission_cost",
                    print_due:false,
                    file:"pdf",
                    services:[],
                    providers:[],
                },
                options_services: [],
                options_providers: [],
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}general/services/`,{
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
        if(window.confirm("¿Desea eliminar '"+row.name+"' de servicio?")){
            axios.delete(`${ApiUrl}general/services/${row.id}/`)
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

    handleClose = () => {
        this.setState(function (prevState) {
            return {
                modal_report: {
                    ...prevState.modal_report,
                    open:false,
                },
            };
        });
	}

    handleReportService = () =>{
        this.setState(function (prevState) {
            return {
                modal_report: {
                    ...prevState.modal_report,
                    open:true,
                },
            };
        });
    }

    render(){
        const data = this.state.data;
        const modal_report = this.state.modal_report;
        return(
            <div>
                <p id="before-table"></p>
                <Button color="primary"
                    className='mb-3' 
                    onClick={(e)=> this.handleReportService()}>
                    Reporte de servicios
                </Button>
                <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"20%"}>Propiedades</th>
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("name")}>Nombre {this.sortTable("name")}</th>
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("provider__name")}>Proveedor{this.sortTable("provider__name")}</th>
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("activity__name")}>Actividad{this.sortTable("activity__name")}</th>
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("business_group__name")}>Grupo de negocio{this.sortTable("business_group__name")}</th>
                            <th width={"10%"} onClick={(e)=> this.onColumnClick("is_transfer")}>¿Traslado?{this.sortTable("is_transfer")}</th>
                            <th width={"10%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{row.properties_data.map((property) => (property.name+","))}</td>
                                <td>{row.name}</td>
                                <td>{row.provider_name}</td>
                                <td>{row.activity_name}</td>
                                <td>{row.business_group_name}</td>
                                <td>{row.is_transfer?"Si":"No"}</td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        <Link to={`/catalogs/service/${row.id}`}>
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
              <ModalServiceFilterListReport handleClose={this.handleClose} data={modal_report}/>
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <ServiceList {...props} history={history} />;
}