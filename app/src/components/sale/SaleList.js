import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input, InputGroup, Spinner } from "reactstrap";
import { ApiSalesUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ModalSaleFilter from './ModalSaleFilter';
import { loadFilterSettings, saveFilterSettings } from '../../constants/api/localFilterSettings';
import ModalCancelationRefundForce from './ModalCancelationRefundForce';
import AxiosSaleInstance from './AxiosSaleInstance';
class SaleList extends Component{
    constructor(props){
        super(props);
        this.onFilterModal = this.onFilterModal.bind(this);
        this.state={
            data:[],
            modal_filter:{
                open:false,
                params:{
                    sale_date_after:"",
                    sale_date_before:"",
                    sale_key:"",
                    sale_key_manual:"",
                    sale_type__name:"",
                    name_pax:"",
                    service_date_after:"",
                    service_date_before:"",
                    service__name:"",
                    hotel__name:"",
                    representative__name:"",
                    email:"",
                    user_extension__user__username:"",
                    status:""
                }
            },
            modal_cancelation_refund:{
                title: "",
                type: '',
                message: null,
                sale: null
            },
            params:{
                search: "",
                ordering: "-sale_date",
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
            const response = await AxiosSaleInstance.get('sales_table/', {
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
        let params = loadFilterSettings('sale-filter-table');
        if(params){
            this.setState({
                params:Object.assign(params,{
                    search: "",
                    ordering: "-sale_date",
                    limit: 100,
                }),
            },()=>this.refreshList());
        } else {
            this.setState({
                params:{
                    search: "",
                    ordering: "-sale_date",
                    limit: 100,
                },
            },()=>this.refreshList());
        }
    }

    componentDidUpdate(prevProps, prevState){
        if(JSON.stringify(this.state.params) !== JSON.stringify(prevState.params)){
            this.refreshList();
        }
    }

    onCancelRow = (row) =>{
        if(window.confirm("¿Desea cancelar la venta "+row.sale_key.toString().padStart(8, '0')+"?")){
            axios.put(`${ApiSalesUrl}cancel_sale/${row.id}/`)
            .then(res => {
                this.refreshList();
            }).catch(error => {
                if(error.response.data.hasOwnProperty('error')){
                    window.alert(error.response.data.error);
                }
                if(error.response.data.hasOwnProperty('opera')){
                    this.setState(function (prev_State) {
                        return {
                            modal_cancelation_refund: {
                                ...prev_State.modal_cancelation_refund,
                                type:"cancel",
                                sale:row,
                                message: error.response.data.opera + "\n ¿Desea cancelar sin opera? Todos los cargo a habitación deberan hacerce de forma manual" ,
                            },
                        };
                    });
                }
            });
        }
    }

    handleCancelForce = (row) =>{
        this.setState(function (prev_State) {
            return {
                modal_cancelation_refund:{
                    ...prev_State.modal_cancelation_refund,
                    title: "",
                    type: '',
                    message: null,
                    sale: null
                }
            };
        });
        axios.put(`${ApiSalesUrl}cancel_sale_force/${row.id}/`)
        .then(res => {
            this.refreshList();
        }).catch(this.catchSaleError);
    }

    onRefundRow = (row) =>{
        if(window.confirm("¿Desea hacer reembolso de la venta "+row.sale_key.toString().padStart(8, '0')+"?")){
            axios.put(`${ApiSalesUrl}refund_sale/${row.id}/`)
            .then(res => {
                this.refreshList();
            }).catch(error => {
                if(error.response.data.hasOwnProperty('error')){
                    window.alert(error.response.data.error);
                }
                if(error.response.data.hasOwnProperty('opera')){
                    this.setState(function (prev_State) {
                        return {
                            modal_cancelation_refund: {
                                ...prev_State.modal_cancelation_refund,
                                type:"refund",
                                sale:row,
                                message: error.response.data.opera + "\n ¿Desea hacer reembolso sin opera?, Todos los cargo a habitación deberan hacerce de forma manual" ,
                            },
                        };
                    });
                }
            });
        }
    }

    handleRefundForce = (row) =>{
        this.setState(function (prev_State) {
            return {
                modal_cancelation_refund:{
                    ...prev_State.modal_cancelation_refund,
                    title: "",
                    type: '',
                    message: null,
                    sale: null
                }
            };
        });
        axios.put(`${ApiSalesUrl}refund_sale_force/${row.id}/`)
        .then(res => {
            this.refreshList();
        }).catch(this.catchSaleError);
    }

    catchSaleError = (error) =>{
        if(error.response.data.hasOwnProperty('error')){
            window.alert(error.response.data.error);
        } else {
            window.alert("Error de solicitud");
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

    onFilterModal = () => {
        let params = {
            sale_date_after:"",
            sale_date_before:"",
            sale_key:"",
            sale_key_manual:"",
            sale_type__name:"",
            name_pax:"",
            service_date_after:"",
            service_date_before:"",
            service__name:"",
            hotel__name:"",
            representative__name:"",
            email:"",
            user_extension__user__username:"",
            status:""
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
                modal_cancelation_refund:{
                    ...prev_State.modal_cancelation_refund,
                    title: "",
                    type: '',
                    message: null,
                    sale: null
                }
            };
        });
    }

    handleSaveFilter = (params) => {
        let current_params = Object.assign({},this.state.params);
        let new_params = saveFilterSettings(Object.assign(current_params,params),'sale-filter-table');
        if(new_params===undefined){
            console.log('No se pudo guardar el filtro');
            new_params = params;
        }
        this.setState(function (prevState) {
            return {
                modal_filter:{
                    ...prevState.modal_filter,
                    open: false,
                },
                params:new_params
            };
        });
	}

    render(){
        const { data, modal_filter, modal_cancelation_refund, loading } = this.state;
        return(<>
            <Row>
                <Col lg="3">
                    <ButtonGroup style={{width:"100%"}}>
                        <Button href={"/sale/"} className="btn" color="primary" size="sm" block>
                            <h5 className='mb-0'><i className="bi bi-plus"></i> Venta</h5>
                        </Button>
                        <Button href={"/sale_reserved/"} className="btn" color="secondary" size="sm" block>
                            <h5 className='mb-0'><i className="bi bi-plus"></i> Bloqueo</h5>
                        </Button>
                    </ButtonGroup>
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
                    <Table size='xs' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"6%"} onClick={(e)=> this.onColumnClick("sale_key")}>Cupon {this.sortTable("sale_key")}</th>
                                <th onClick={(e)=> this.onColumnClick("representative__name")}>Representante {this.sortTable("representative__name")}</th>
                                <th onClick={(e)=> this.onColumnClick("sale_date")}>Fecha Venta {this.sortTable("sale_date")}</th>
                                <th onClick={(e)=> this.onColumnClick("name_pax")}>Pasajero {this.sortTable("name_pax")}</th>
                                <th onClick={(e)=> this.onColumnClick("status")}>Estado {this.sortTable("status")}</th>
                                <th /* onClick={(e)=> this.onColumnClick("amount")} */>Importe {/* {this.sortTable("amount")} */}</th>
                                <th onClick={(e)=> this.onColumnClick("service_date")}>Fecha Serv {this.sortTable("service_date")}</th>
                                <th width={"8%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={"13"}> <Spinner className="m-5" color="primary"/></td></tr>}
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.sale_key.toString().padStart(8, '0')}</td>
                                    <td>{row.representative_name}</td>
                                    <td>{row.status==="B"?"":moment(row.sale_date.substring(0, 10)).format('DD/MM/YYYY')}</td>
                                    <td>{row.name_pax}</td>
                                    <td>{row.status}</td>
                                    <td>{row.status==="B"?"":row.totals.total}</td>
                                    <td>{moment(row.service_date).format('DD/MM/YYYY')}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Link to={`/sale/${row.id}`}>
                                                <Button color="info"
                                                    size='sm'>
                                                    <i className="bi bi-pencil-fill"></i>
                                                </Button>
                                            </Link>
                                            {row.status==="A"?
                                            <Button color="warning" 
                                                size='sm'
                                                onClick={(e)=> this.onRefundRow(row)}>
                                                <i className="bi bi-cash-coin"></i>
                                            </Button>
                                            :<></>}
                                            {row.status==="A"||row.status==="B"?
                                            <Button color="danger" 
                                                size='sm'
                                                onClick={(e)=> this.onCancelRow(row)}>
                                                <i className="bi bi-x-circle-fill"></i>
                                            </Button>
                                            :<></>}
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))} 
                        </tbody>
                    </Table>
                </Col>
            </Row>
            <ModalCancelationRefundForce handleClose={this.handleClose} handleCancelForce={this.handleCancelForce} handleRefundForce={this.handleRefundForce} data={modal_cancelation_refund} />
            <ModalSaleFilter handleClose={this.handleClose} handleSave={this.handleSaveFilter} data={modal_filter}/>
        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    return <SaleList {...props} history={history} />;
}