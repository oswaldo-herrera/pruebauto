import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input, FormGroup, Label } from "reactstrap";
import { ApiOperationsUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import { getProfile } from '../user/UserModel';
import ModalAlert from '../ModalAlert';
import Select from 'react-select';
class InvoiceOperationProvider extends Component{
    constructor(props){
        super(props);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.state={
            data:[],
            params:{
                start_date: "",
                due_date: "",
                provider:null,
            },
            permissions:[],
            options_providers: [],
            provider_request:false,
            cxp_request:false,
            modal:{
                title: "Proveedores",
                type: 'success',
                message: null,
            },
        }
        getProfile().then((result) =>{
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        provider:result.provider_data
                    },
                    permissions:result.permissions,
                };
            });
            axios.get(`${ApiUrl}general/providers/?limit=500`)
            .then(res => {
                this.setState({
                    options_providers:res.data.results.map((provider)=>{return {value:provider.id,label:provider.name,data:provider}})
                });
            });
        });
    }

    onChangeValue(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:event.target.value,
                },
            };
        });
    }

    onChangeSelectValue(data, event) {
        let value = data?data.data:data;
        this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.name]:value,
				},
                data:[]
			};
		});
    }

    refreshList = (event) => {
        axios.get(`${ApiOperationsUrl}invoice_reservation_transfer/`,{
            params: {
                start_date:this.state.params.start_date,
                due_date:this.state.params.due_date,
                provider:this.state.params.provider.id,
            },
        }).then(res=>{
            this.setState({
                data:res.data
            });
        }).catch(this.catchDateError);
    };

    reportInvoice(format){
        var url = `${ApiOperationsUrl}invoice_reservation_report/?`;
        url = url + `start_date=${this.state.params.start_date}`;
        url = url + `&due_date=${this.state.params.due_date}`;
        url = url + `&provider=${this.state.params.provider.id}`;
        url = url + `&type=${format}`;
        window.open(url, "_blank");
	}

    catchDateError = (error) =>{
        if(error.response.status == 500){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: "Error interno de servidor: contacte al administrador del sistema para continuar",
                    },
                };
            });
        } else if(error.response.data.hasOwnProperty('error')){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.error,
                    },
                    params:{
                        ...prev_State.params,
                        due_date: "",
                    },
                };
            });
        }
    }

    IsProviderProfile(){
        if(this.state.permissions.length > 0){
            let permission = this.state.permissions.find((permission)=>permission==="GeneralApp.provider_permission")
            return permission !== undefined;
        }
        return false;
    }

    IsCXPProfile(){
        if(this.state.permissions.length > 0){
            let permission = this.state.permissions.find((permission)=>permission==="GeneralApp.cxp_permission")
            return permission !== undefined;
        }
        return false;
    }

    handleSave = () => {
        if(this.IsProviderProfile()){
            this.setState({
                provider_request:true,
            });
            axios.patch(`${ApiOperationsUrl}patch_provider/`,{
                list:this.state.data
            }).finally(()=>{
                this.setState({
                    provider_request:false,
                },()=>this.onFinish());
            });
        }
        if(this.IsCXPProfile()){
            this.setState({
                cxp_request:true,
            });
            axios.patch(`${ApiOperationsUrl}patch_cxp/`,{
                list:this.state.data
            }).finally(()=>{
                this.setState({
                    cxp_request:false,
                },()=>this.onFinish());
            });
        }
        
	}

    onFinish(){
        if(this.state.provider_request===false&&this.state.cxp_request===false){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"success",
                        message: "¡Actualización exitosa!",
                    },
                };
            });
            this.refreshList();
        }
    }

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
        
	}

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    get_row_total(row){
        if(row.invoice_cash_cxp&&(row.invoice_type==="cash"||row.no_show==="no_show_cost")){
            return this.state.params.provider.currency !== "USD"?this.currencyFormat(row.cost_currency)+" "+this.state.params.provider.currency:this.currencyFormat(row.cost_usd)+" USD"
        }
        return this.currencyFormat(0) + " " + this.state.params.provider.currency;
    }
    
    get_total(){
        let total = 0
        this.state.data.forEach(row => {
            if(row.invoice_cash_cxp&&(row.invoice_type==="cash"||row.no_show==="no_show_cost")){
                total += this.state.params.provider.currency !== "USD"?row.cost_currency:row.cost_usd;
            }
        });
        return this.currencyFormat(total) + " " + this.state.params.provider.currency;
    }

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "provider":
                options = this.state.options_providers;
                value = this.state.params[field];
                if(value !== null){
                    value = options.find((option)=>option.value===this.state.params[field].id);
                }
                break;
        }
        return value;
    }

    render(){
        const { data, params, options_providers, modal, cxp_request, provider_request} = this.state;
        const type_option = {
            'DEPARTURES':'S',
            'ARRIVALS':'L',
            'INTERHOTEL':'I'
        }
        const select_option_provider = this.getOptionValue("provider");
        const customSelectStyles = {
            control: (base) => ({
                ...base,
                height: 30,
                minHeight: 30
            }),
            singleValue: (provided) => ({
                ...provided,
                height: '30px',
                padding: '0px'
            }),
            input: (provided, state) => ({
                ...provided,
                margin: '0px',
            }),
            indicatorSeparator: state => ({
                display: 'none',
            }),
            indicatorsContainer: (provided, state) => ({
                ...provided,
                height: '30px',
            }),
            clearIndicator: (provided, state) => ({
                ...provided,
                padding: '2px',
            }),
            dropdownIndicator: (provided, state) => ({
                ...provided,
                padding: '2px',
            }),
        };
        return(<>
            <Row>
                <Col sm={2}>
                    <FormGroup>
                        <Label size='sm'>
                            Fecha inicio
                        </Label>
                        <Input type='date'
                            bsSize={'sm'}
                            name="start_date"
                            placeholder="Fecha inicio"
                            value={params.start_date}
                            onChange={this.onChangeValue}
                            />
                    </FormGroup>
                </Col>
                <Col sm={2}>
                    <FormGroup>
                        <Label size='sm'>
                            Fecha fin
                        </Label>
                        <Input type='date'
                            bsSize={'sm'}
                            name="due_date"
                            placeholder="Fecha fin"
                            value={params.due_date}
                            onChange={this.onChangeValue}/>
                    </FormGroup>
                </Col>
                {this.IsCXPProfile()?
                <Col sm={4}>
                    <FormGroup>
                        <Label size='sm'>Proveedor</Label>
                        <Select
                            styles={customSelectStyles}
                            options={options_providers}
                            isClearable={true}
                            isSearchable={true}
                            name="provider"
                            value={select_option_provider}
                            onChange={this.onChangeSelectValue}
                            required/>
                    </FormGroup>
                </Col>:<></>}
                <Col sm={1}>
                    <ButtonGroup>
                        <Button className="btn" color="primary" size="sm" block style={{marginTop:'2rem'}}
                            onClick={(e)=> this.refreshList()} disabled={(params.start_date===""||params.due_date==="")||params.provider===null}>
                            <h5 className='mb-0'><i className="bi bi-search"></i></h5>
                        </Button>
                        <Button className="btn" color="success" size="sm" block style={{marginTop:'2rem'}}
                            onClick={(e)=> this.reportInvoice("excel")} disabled={(params.start_date===""||params.due_date==="")||params.provider===null}>
                            <h5 className='mb-0'><i className="bi bi-file-earmark-excel-fill"></i></h5>
                        </Button>
                        <Button className="btn" color="info" size="sm" block style={{marginTop:'2rem'}}
                            onClick={(e)=> this.reportInvoice("pdf")} disabled={(params.start_date===""||params.due_date==="")||params.provider===null}>
                            <h5 className='mb-0'><i className="bi bi-file-earmark-pdf-fill"></i></h5>
                        </Button>
                    </ButtonGroup>
                </Col>
                <Col sm={12}>
                    <p id="before-table"></p>
                    <div className='table-scroll'>       
                        <div className='table-wrap'>
                            <Table size='xs' className="no-wrap align-middle" responsive bordered id="dataTable">
                                <thead>
                                    <tr>
                                        <th colSpan={8}></th>
                                        <th colSpan={4}>Proveedor: {params.provider?params.provider.name:""}</th>
                                        <th colSpan={1}>CXP</th>
                                        <th colSpan={1}></th>
                                    </tr>
                                    <tr>
                                        <th colSpan={10}></th>
                                        <th colSpan={2}>No Show</th>
                                        <th colSpan={2}></th>
                                    </tr>
                                    <tr>
                                        <th width={"7.5%"}>Fecha</th>
                                        <th width={"9%"}>referencia#</th>
                                        <th width={"6%"}>#Cupon</th>
                                        <th width={"11%"}>#Boarding Pass</th>
                                        <th width={"11.5%"}>Servicio</th>
                                        <th width={"4%"}>Pax</th>
                                        <th width={"7.5%"}>Costo USD</th>
                                        <th width={"7.5%"}>Costo MN</th>
                                        <th width={"7.5%"}>Efectivo</th>
                                        <th width={"7.5%"}>No Show</th>
                                        <th width={"5.5%"}>Con costo</th>
                                        <th width={"5.5%"}>Sin costo</th>
                                        <th width={"5%"}>Efectivo CXP</th>
                                        <td width={"5%"}></td>
                                    </tr>
                                </thead>
                                {params.provider?<>
                                <tbody>
                                    {data.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{moment(row.date).format('DD/MM/YYYY')}</td>
                                            <td>{row.reservation.toString().padStart(6, '0')}</td>
                                            <td>{row.coupon?row.coupon:""}</td>
                                            <td>{row.id.toString().padStart(8, '0')}</td>
                                            <td>{row.service_name + "-" + type_option[row.transfer_type]}</td>
                                            <td>{row.adults+row.childs}</td>
                                            <td>{this.currencyFormat(row.cost_usd)} USD</td>
                                            <td>{this.currencyFormat(row.cost_currency) + " " + params.provider.currency}</td>
                                            <td>
                                                <FormGroup switch>
                                                    <Input type="switch" 
                                                        disabled={!this.IsProviderProfile()||row.invoice_cash_cxp}
                                                        checked={row.invoice_type==="cash"}
                                                        onChange={(event)=>{
                                                            let value = event.target.checked?"cash":"none",
                                                                data = this.state.data,
                                                                no_show = event.target.checked?"none":data[index].no_show;
                                                                
                                                            data[index].invoice_type = value;
                                                            data[index].no_show = no_show;
                                                            this.setState({
                                                                data:data
                                                            });
                                                        }}/>
                                                </FormGroup>
                                            </td>
                                            <td>
                                                <FormGroup switch>
                                                    <Input type="switch" 
                                                        disabled={!this.IsProviderProfile()||row.invoice_cash_cxp}
                                                        checked={row.invoice_type==="no_show"}
                                                        onChange={(event)=>{
                                                            let data = this.state.data,
                                                                value = "none",
                                                                no_show = "none",
                                                                row = data[index];
                                                            if(event.target.checked){
                                                                value = "no_show"
                                                                if(row.transfer_type==="ARRIVALS"){
                                                                    no_show = "no_show_no_cost";
                                                                } else {
                                                                    no_show = "no_show_cost";
                                                                }
                                                            }
                                                            
                                                            data[index].invoice_type = value;
                                                            data[index].no_show = no_show;
                                                            this.setState({
                                                                data:data
                                                            });
                                                        }}/>
                                                </FormGroup>
                                            </td>
                                            <td>
                                                <FormGroup switch>
                                                    <Input type="switch" 
                                                        disabled={!this.IsCXPProfile()}
                                                        checked={row.no_show==="no_show_cost"}
                                                        onChange={(event)=>{
                                                            let value = event.target.checked?"no_show_cost":"none",
                                                                data = this.state.data;
                                                            data[index].no_show = value;
                                                            data[index].invoice_type = event.target.checked?"no_show":data[index].invoice_type;
                                                            this.setState({
                                                                data:data
                                                            });
                                                        }}/>
                                                </FormGroup>
                                            </td>
                                            <td>
                                                <FormGroup switch>
                                                    <Input type="switch" 
                                                        disabled={!this.IsCXPProfile()}
                                                        checked={row.no_show==="no_show_no_cost"}
                                                        onChange={(event)=>{
                                                            let value = event.target.checked?"no_show_no_cost":"none",
                                                                data = this.state.data;
                                                            data[index].no_show = value;
                                                            data[index].invoice_type = event.target.checked?"no_show":data[index].invoice_type;
                                                            this.setState({
                                                                data:data
                                                            });
                                                        }}/>
                                                </FormGroup>
                                            </td>
                                            <td>
                                                <FormGroup switch>
                                                    <Input type="switch" 
                                                        disabled={!this.IsCXPProfile()}
                                                        checked={row.invoice_cash_cxp}
                                                        onChange={(event)=>{
                                                            let data = this.state.data;
                                                            data[index].invoice_cash_cxp = event.target.checked;
                                                            this.setState({
                                                                data:data
                                                            });
                                                        }}/>
                                                </FormGroup>
                                            </td>
                                            <td>{this.get_row_total(row)}{}</td>
                                        </tr>
                                    ))} 
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={13}></td>
                                        <td colSpan={13}>{this.get_total()}</td>
                                    </tr>
                                </tfoot>
                                </>:<></>}
                            </Table>
                        </div>
                    </div>
                </Col>
                <Col></Col>
                <Col lg="2">
                    <Button className="btn" color="primary" size="sm" block style={{marginTop:'2rem'}}
                        onClick={(e)=> this.handleSave()} disabled={data.length===0||provider_request||cxp_request}>
						<h5 className='mb-0'>Guardar<i className="bi bi-floppy-fill"></i></h5>
					</Button>
                </Col>
            </Row>
            <ModalAlert handleClose={this.handleClose} handleCloseError={this.handleClose} data={modal}  />
            </>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <InvoiceOperationProvider {...props} history={history} />;
}