import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input, InputGroup, Spinner } from "reactstrap";
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ModalReservationFilter from './ModalReservationFilter';
import { loadFilterSettings, saveFilterSettings } from '../../constants/api/localFilterSettings';
import { getProfile } from '../user/UserModel';
import AxiosOperationInstance from './AxiosOperationInstance';

class ReservationList extends Component{
    constructor(props){
        super(props);
        this.onFilterModal = this.onFilterModal.bind(this);
        this.state={
            data:[],
            modal_filter:{
                open:false,
                params:{
                    reservation_date_after:"",
                    reservation_date_before:"",
                    id:"",
                    sale_type__name:"",
                    pax:"",
                    arrival_date_after:"",
                    arrival_date_before:"",
                    arrival_flight:"",
                    arrival_service:"",
                    arrival_hotel:"",
                    departure_date_after:"",
                    departure_date_before:"",
                    departure_flight:"",
                    departure_service:"",
                    departure_hotel:"",
                    email:"",
                    user_extension__user__username:"",
                }
            },
            params:{
                search: "",
                ordering: "-reservation_date",
                limit: 100,
            },
            loading: false,
            error: null,
        }
        this.controller = new AbortController();
        this.signal = this.controller.signal;
    }

    refreshList(){
        this.fetchData(this.state.params);
    };

    fetchData = async (params) => {
        this.setState({ loading: true });
        try {
            this.controller.abort();
            this.controller = new AbortController();
            this.signal = this.controller.signal;
            const response = await AxiosOperationInstance.get('reservations_table/', {
                params: params,
                signal: this.signal,
            });
            this.setState({
                data:response.data.results
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Consulta cancelada:', error.message);
            } else {
                this.setState({ error });
            }
        }
        this.setState({ loading: false });
    };

    componentWillUnmount() {
        this.controller.abort();
    }

    componentDidMount(){
        let params = loadFilterSettings('reservation-filter-table');
        if(params){
            this.setState({
                params:Object.assign(params,{
                    search: "",
                    ordering: "-reservation_date",
                    limit: 100,
                }),
            },()=>this.refreshList());
        } else {
            this.setState({
                params:{
                    search: "",
                    ordering: "-reservation_date",
                    limit: 100,
                },
            },()=>this.refreshList());
        }
    }

    componentDidUpdate(prevProps, prevState){
        if(JSON.stringify(this.state.params) !== JSON.stringify(prevState.params)){
            this.refreshList();
            let params = saveFilterSettings(Object.assign(this.state.modal_filter.params,this.state.params),'reservation-filter-table')
            if(params===undefined)
                console.log('No se pudo guardar el filtro');
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.id.toString().padStart(6, '0')+"' de reservación?")){
            axios.delete(`${ApiUrl}operations/reservations/${row.id}/`)
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

    onCancelRow = (row) =>{
        if(window.confirm("¿Desea cancelar la reserva con Referencia#: "+row.id.toString().padStart(6, '0')+"?")){
            axios.put(`${ApiOperationsUrl}cancel_reservation/${row.id}/`)
                .then(res => {
                    this.refreshList();
                }).catch(this.catchReservationError);
        }
    }

    onReactivateRow = (row) =>{
        if(window.confirm("¿Desea reactivar la reserva con Referencia#: "+row.id.toString().padStart(6, '0')+"?")){
            axios.put(`${ApiOperationsUrl}reactivate_reservation/${row.id}/`)
                .then(res => {
                    this.refreshList();
                }).catch(this.catchReservationError);
        }
    }

    catchReservationError = (error) =>{
        if(error.response.data.hasOwnProperty('error')){
            window.alert(error.response.data.error);
        } else {
            window.alert("Error de solicitud");
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
                modal_filter:{
                    ...prevState.modal_filter,
                    params: {
                        ...prevState.modal_filter.params,
                        search: e.target.value,
                    },
                }
            };
        });
	};

    onFilterModal = () => {
        let params = {
            reservation_date_after:"",
            reservation_date_before:"",
            id:"",
            sale_type__name:"",
            pax:"",
            arrival_date_after:"",
            arrival_date_before:"",
            arrival_flight:"",
            arrival_service:"",
            arrival_hotel:"",
            departure_date_after:"",
            departure_date_before:"",
            departure_flight:"",
            departure_service:"",
            departure_hotel:"",
            email:"",
            user_extension__user__username:"",
        };
        this.setState(function (prev_State) {
            return {
                modal_filter:{
                    ...prev_State.modal_filter,
                    open: true,
                    params:params
                }
            };
        });
    }

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_filter:{
                    ...prev_State.modal_filter,
                    open: false
                },
                modal_reservation_token:{
                    ...prev_State.modal_reservation_token,
                    open: false
                },
            };
        });
    }

    handleSaveFilter = (params) => {
        this.setState(function (prevState) {
            return {
                modal_filter:{
                    ...prevState.modal_filter,
                    open: false,
                },
                params:params
            };
        });
	}

    render(){
        const { data, modal_filter, loading } = this.state;
        const style = {
            table: {
              width: '100%',
              display: 'table',
              borderspacing: 0,
              bordercollapse: 'separate',
            },
            th: {
              top: 0,
              left: 0,
              zindex: 2,
              position: 'sticky',
              backgroundcolor: '#fff',
            },
          };
        return(<>
            <Row>
                <Col lg="2">
                    <Link to={"/reservation/"}>
						<Button className="btn" color="primary" size="sm" block>
							<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
						</Button>
					</Link>
                </Col>
                <Col></Col>
                <Col lg="4">
                    <InputGroup>
                        <Input
                            bsSize="sm"
                            name="search"
                            placeholder="Busqueda"
                            type="search"
                            value={modal_filter.params.search}
                            onChange={this.onChangeSearch.bind(this)}/>
                        <Button size='sm'
                            onClick={this.onFilterModal}>
                            <i className="bi bi-funnel-fill"></i>
                        </Button>
                    </InputGroup>
				</Col>
                <Col lg="12">
                    <p id="before-table"></p>
                    <Table size='xs' className="no-wrap align-middle" style={style.table} responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"6%"} onClick={(e)=> this.onColumnClick("reservation_date")}>Fecha {this.sortTable("reservation_date")}</th>
                                <th onClick={(e)=> this.onColumnClick("sale_type__name")}>Tipo de venta {this.sortTable("sale_type__name")}</th>
                                <th onClick={(e)=> this.onColumnClick("pax")}>Nombre Pax {this.sortTable("pax")}</th>
                                <th onClick={(e)=> this.onColumnClick("opera_code")}>Reserva opera{this.sortTable("opera_code")}</th>
                                <th onClick={(e)=> this.onColumnClick("status")}>STATUS {this.sortTable("status")}</th>
                                <th onClick={(e)=> this.onColumnClick("pax_num")}>Pax {this.sortTable("pax_num")}</th>
                                <th onClick={(e)=> this.onColumnClick("id")}>Referencia# {this.sortTable("id")}</th>
                                <th width={"6%"} onClick={(e)=> this.onColumnClick("arrival_date")}>Llega {this.sortTable("arrival_date")}</th>
                                <th onClick={(e)=> this.onColumnClick("arrival_flight")}>Vuelo {this.sortTable("arrival_flight")}</th>
                                <th width={"6%"} onClick={(e)=> this.onColumnClick("departure_date")}>Sale {this.sortTable("departure_date")}</th>
                                <th onClick={(e)=> this.onColumnClick("departure_flight")}>Vuelo {this.sortTable("departure_flight")}</th>
                                <th onClick={(e)=> this.onColumnClick("hotel")}>Hotel {this.sortTable("hotel")}</th>
                                <th>Ventas</th>
                                <th width={"8%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={"13"}> <Spinner className="m-5" color="primary"/></td></tr>}
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{moment(row.reservation_date).format('DD/MM/YYYY')}</td>
                                    <td>{row.sale_type_name}</td>
                                    <td>{row.pax}</td>
                                    <td>{row.opera_code}</td>
                                    <td>{row.status}</td>
                                    <td>{row.pax_num}</td>
                                    <td>{row.id.toString().padStart(6, '0')}</td>
                                    <td>{row.arrival_date?moment(row.arrival_date).format('DD/MM/YYYY'):""}</td>
                                    <td>{row.arrival_flight}</td>
                                    <td>{row.departure_date?moment(row.departure_date).format('DD/MM/YYYY'):""}</td>
                                    <td>{row.departure_flight}</td>
                                    <td>{row.hotel}</td>
                                    <td>{row.sales.map((sale) => <p>{sale}</p>)}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Link to={`/reservation/${row.id}`}>
                                                <Button color="info"
                                                    size='sm'>
                                                    <i className="bi bi-pencil-fill"></i>
                                                </Button>
                                            </Link>
                                            {row.status==="NORMAL"?
                                            <Button color="danger" 
                                                size='sm'
                                                onClick={(e)=> this.onCancelRow(row)}>
                                                <i className="bi bi-x-circle-fill"></i>
                                            </Button>
                                            :<Button color="success" 
                                                size='sm'
                                                onClick={(e)=> this.onReactivateRow(row)}>
                                                <i className="bi bi-arrow-up-circle"></i>
                                            </Button>}
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))} 
                        </tbody>
                    </Table>
                </Col>
            </Row>
            <ModalReservationFilter handleClose={this.handleClose} handleSave={this.handleSaveFilter} data={modal_filter}/>
        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    return <ReservationList {...props} history={history} />;
}