import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class FlightList extends Component{
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
        axios.get(`${ApiUrl}operations/flights/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: ""
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.code+"' de Vuelo?")){
            axios.delete(`${ApiUrl}operations/flights/${row.id}/`)
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

    onChangeSearch(e) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: e.target.value,
                },
            };
        });
	};

    render(){
        const { data, params} = this.state;
        const type_option = {
            'departure':'Salida',
            'arrival':'Llegada',
            'both':'Ambos'
        }
        return(
            <Row>
                <Col lg="2">
                    <Link to={"/flight/"}>
						<Button className="btn" color="primary" size="sm" block>
							<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
						</Button>
					</Link>
                </Col>
                <Col></Col>
                <Col lg="4">
					<Input
						bsSize="sm"
						name="search"
						placeholder="Busqueda"
						type="search"
						value={params.search}
						onChange={this.onChangeSearch.bind(this)}/>
				</Col>
                <Col lg="12">
                    <p id="before-table"></p>
                    <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"12%"} onClick={(e)=> this.onColumnClick("code")}>#Vuelo {this.sortTable("code")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("flight_type")}>Tipo de vuelo {this.sortTable("flight_type")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("start_date")}>Fecha de inicio {this.sortTable("start_date")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("due_date")}>Fecha fin {this.sortTable("due_date")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("origin")}>Origen{this.sortTable("origin")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("destination")}>Destino {this.sortTable("destination")}</th>
                                <th width={"13%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.code}</td>
                                    <td>{type_option[row.flight_type]}</td>
                                    <td>{moment(row.start_date).format('LL')}</td>
                                    <td>{moment(row.due_date).format('LL')}</td>
                                    <td>{row.origin}</td>
                                    <td>{row.destination}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Link to={`/flight/${row.id}`}>
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
                </Col>
            </Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <FlightList {...props} history={history} />;
}