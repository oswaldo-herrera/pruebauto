import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, InputGroup, Badge } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import IframePaymentCredit from './IframePaymentCredit';
class ModalSalePayment extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueCardKey = this.onChangeValueCardKey.bind(this);
        this.onChangeValueNip = this.onChangeValueNip.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handlePaymentRequest = this.handlePaymentRequest.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            index: null,
            sale_payments_amount:0,
            sale_total:0,
            sale_payment: null,
            sale_id: null,
            property:null,
            exchange_rate:null,
            card_key:null,
            nip:null,
            store_card_name:null,
            options_payment_methods:[],
            options_departments_cecos:[],
            iframe_payment:{
                view:false,
                url:"",
                complete:false,
                id:null
            }
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				sale_payment: {
					...prevState.sale_payment,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeValueCardKey(event) {
		this.setState(function (prevState) {
			return {
				card_key:event.target.value,
			};
		});
    }

    onChangeValueNip(event) {
		this.setState(function (prevState) {
			return {
				nip:event.target.value,
			};
		});
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
        this.setState(function (prevState) {
            return {
                sale_payment: {
                    ...prevState.sale_payment,
                    [event.name]:value,
                    [event.name+'_data']:data?data.data:null,
                },
            };
        },()=>{
            if(event.name==="payment_method"){
                if(this.state.sale_payment.payment_method_data===null){
                    this.setState(function (prevState) {
                        return {
                            sale_payment: {
                                ...prevState.sale_payment,
                                amount:0,
                                department_cecos:null,
                                department_cecos_data:null,
                            },
                        };
                    });
                } else {
                    var owned = this.state.sale_total - this.state.sale_payments_amount;
                    if(this.state.sale_payment.payment_method_data.currency === "MN"){
                        owned = owned*this.state.exchange_rate.usd_currency;
                    } else if(this.state.sale_payment.payment_method_data.currency === "EURO"){
                        owned = (owned/this.state.exchange_rate.euro_currency)*this.state.exchange_rate.usd_currency;
                    }
                    if(this.state.sale_payment.payment_method_data.card_charge===true){
                        this.setState(function (prevState) {
                            return {
                                sale_payment: {
                                    ...prevState.sale_payment,
                                    amount:owned.toFixed(2),
                                    department_cecos:null,
                                    department_cecos_data:null,
                                },
                                iframe_payment:{
                                    view:false,
                                    url:"",
                                    complete:false,
                                    id:null
                                }
                            };
                        });
                    } else if(this.state.sale_payment.payment_method_data.courtesy===false){
                        this.setState(function (prevState) {
                            return {
                                sale_payment: {
                                    ...prevState.sale_payment,
                                    amount:owned.toFixed(2),
                                    department_cecos:null,
                                    department_cecos_data:null,
                                },
                            };
                        });
                    } else {
                        this.setState(function (prevState) {
                            return {
                                sale_payment: {
                                    ...prevState.sale_payment,
                                    amount:owned.toFixed(2),
                                },
                            };
                        });
                    }
                }
            }
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.sale_payment !== new_data.sale_payment)
			return true;
        if(prev_data.index !== new_data.index)
			return true;
        if(prev_data.property !== new_data.property)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)) {
			this.reset(this.props.data);
		}
	}

	reset(data){
        let sale_payment = data.sale_payment!==undefined?data.sale_payment:this.state.sale_payment;
        let sale_id = data.sale_id!==undefined?data.sale_id:this.state.sale_id;
        let index = data.index!==undefined?data.index:this.state.index;
        let sale_payments_amount = data.sale_payments_amount!==undefined?data.sale_payments_amount:this.state.sale_payments_amount;
        let sale_total = data.sale_total!==undefined?data.sale_total.toFixed(2):this.state.sale_total;
        let sale_data = data.sale_data!==undefined?data.sale_data:this.state.sale_data;
        let exchange_rate = data.exchange_rate!==undefined?data.exchange_rate:this.state.exchange_rate;
        let options_payment_methods = data.options_payment_methods!==undefined?data.options_payment_methods:this.state.options_payment_methods;
        let property = data.property!==undefined?data.property:this.state.property;
        let complete = false;
        let card_key = "",
            store_card_name = "";
        if (sale_payment!== null){
            complete = sale_payment.credit_charge_data!==undefined && sale_payment.credit_charge_data!==null;
            if (sale_payment.store_card_charge_data !== null){
                card_key = sale_payment.store_card_charge_data.store_card_card_key.toString().padStart(8, '0');
                store_card_name = sale_payment.store_card_charge_data.store_card_name;
            }
        }
        this.setState(function (prevState) {
            return {
                sale_payment: sale_payment,
                sale_id: sale_id,
                sale_payments_amount: sale_payments_amount,
                sale_total: sale_total,
                sale_data: sale_data,
                index: index,
                property: property,
                exchange_rate: exchange_rate,
                card_key: card_key,
                options_payment_methods: options_payment_methods,
                iframe_payment: {
                    ...prevState.iframe_payment,
                    complete:complete,
                },
            };
        },()=>this.options_load());
        this.setState({
            
        },()=>this.options_load());
	}

    options_load(){
        if(this.state.property!==null&&this.state.sale_payment!==null){
            axios.get(`${ApiUrl}general/departmentscecos/?limit=500`)
            .then(res => {
                this.setState({
                    options_departments_cecos:res.data.results.map((department_cecos)=>{return {value:department_cecos.id,label:department_cecos.code+ " " +department_cecos.name,data:department_cecos}})
                });
            });
        }  
    }

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "payment_method":
                options = this.state.options_payment_methods;
                break;
            case "department_cecos":
                options = this.state.options_departments_cecos;
                break;
        }
        value = options.find((option)=>option.value===this.state.sale_payment[field]);
        return value;
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
		if(this.props.handleSave)
			this.props.handleSave(this.state.sale_payment, this.state.index);
	}

    handlePaymentRequest = (event) => {
		axios.get(`${ApiSalesUrl}credit_charge_request/`,{
            params:{
                name_pax:this.state.sale_data.name_pax,
                email:this.state.sale_data.email,
                amount:this.state.sale_payment.amount,
                payment_method:this.state.sale_data.concept + " - " + this.state.sale_payment.payment_method_data.name,
        }
        }).then(res=>{
            console.log(res.data.webhook)
            this.setState(function (prevState) {
                return {
                    iframe_payment:{
                        ...prevState.iframe_payment,
                        view: true,
                        url:res.data.url,
                        id:res.data.credit_charge
                    }
                };
            });
            window.open(res.data.url, "_blank");
        }).catch(this.catchDateError);
	}

    handleComplete = (params) => {
        axios.get(`${ApiSalesUrl}credit_charge_confirmation/${this.state.iframe_payment.id}/`)
        .then(res=>{
            this.setState(function (prevState) {
                return {
                    sale_payment: {
                        ...prevState.sale_payment,
                        credit_charge_data:res.data
                    },
                    iframe_payment: {
                        ...prevState.iframe_payment,
                        complete:true,
                    },
                };
            });
        }).catch(this.catchDateError);
        
	}

    handleSearchStoreCard = (params) => {
        axios.post(`${ApiSalesUrl}store_card_search_valid/`,{
            card_key:this.state.card_key,
            nip:this.state.nip,
            amount:this.state.sale_payment.amount
        })
        .then(res=>{
            this.setState(function (prevState) {
                return {
                    sale_payment: {
                        ...prevState.sale_payment,
                        store_card_charge_data:res.data
                    },
                };
            });
        }).catch(this.catchDateError);
	}

    catchDateError = (error) =>{
        window.alert(error.response.data.error);
    }

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    new_payments_total(){
        if(this.state.sale_payment !== null && this.state.sale_payment.payment_method_data !== null){
            var amount =  parseFloat(this.state.sale_payment.amount);
            if(this.state.sale_payment.payment_method_data.currency === "MN"){
                amount = amount/this.state.exchange_rate.usd_currency;
            } else if(this.state.sale_payment.payment_method_data.currency === "EURO"){
                amount = (amount*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency;
            }
            return this.state.sale_total - (this.state.sale_payments_amount + amount);
        }
        return this.state.sale_total - this.state.sale_payments_amount;
    }

    check_payment_credit(sale_id,sale_payment,iframe_payment){
        if(sale_payment){
            if(parseFloat(sale_payment.amount)===0.0)
                return true
            if(sale_payment.payment_method_data!==null)
                if(sale_payment.payment_method_data.card_charge === true && iframe_payment.complete === false)
                    return true
        }
        return false
    }

    check_payment_store_card(sale_id,sale_payment){
        if(sale_payment){
            if(parseFloat(sale_payment.amount)===0.0)
                return true
            if(sale_payment.payment_method_data!==null)
                if(sale_payment.payment_method_data.store_card_charge === true && (sale_payment.store_card_charge_data === null ||  sale_payment.store_card_charge_data === undefined))
                    return true
        }
        return false
    }

	render(){
		const { sale_payment,sale_id,options_payment_methods, options_departments_cecos, iframe_payment, card_key, nip, store_card_name } = this.state;
        const select_option_payment_method = sale_payment!==null?this.getOptionValue("payment_method"):null;
        const select_option_department_cecos = sale_payment!==null?this.getOptionValue("department_cecos"):null;
        const customSelectStyles = {
            control: (base) => ({
                ...base,
                height: 30,
                minHeight: 30,
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
            menu: (provided) => ({
                ...provided,
                
            }),
        };
        const new_payments_total = this.new_payments_total()
		return(
			<Modal
				isOpen={sale_payment!==null}
				backdrop="static"
                size='lg'
				keyboard={false}>
				<ModalHeader><div className="text-center">Pago</div></ModalHeader>
				<ModalBody>
                    {sale_payment!==null?
					<Form onSubmit={this.onSubmit} id="service-form">
                        <Row>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Metodo de pago</Label>
                                    <Select styles={customSelectStyles}
                                        options={options_payment_methods}
                                        isClearable={true}
                                        isSearchable={true}
                                        name="payment_method"
                                        value={select_option_payment_method}
                                        onChange={this.onChangeSelectValue}
                                        isDisabled={(sale_payment.room_charge_data !== null)||sale_id!==null||(sale_payment.credit_charge_data !== null)}
                                        required/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Monto</Label>
                                    <Input type="number"
                                        bsSize="sm"
                                        placeholder="Monto"
                                        step={0.01}
                                        name="amount"
                                        value={sale_payment.amount}
                                        onChange={this.onChangeValue}
                                        disabled={(select_option_payment_method==undefined||select_option_payment_method==null||sale_payment.room_charge_data !== null)||sale_id!==null}
                                        required/>
                                </FormGroup>
                            </Col>
                            {sale_payment.payment_method_data !== null && sale_payment.payment_method_data.courtesy?
                            <>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Departamento CECOS</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_departments_cecos}
                                        isClearable={true}
                                        isSearchable={true}
                                        name="department_cecos"
                                        value={select_option_department_cecos}
                                        onChange={this.onChangeSelectValue}
                                        required/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label size='sm'>Autorización </Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        placeholder="Autorización"
                                        name="authorization"
                                        value={sale_payment.authorization}
                                        onChange={this.onChangeValue}
                                        disabled={sale_id!==null}/>
                                </FormGroup>
                            </Col>
                            </>
                            :<Col sm={6}></Col>}
                            {sale_payment.payment_method_data !== null && sale_payment.payment_method_data.card_charge?
                            <>
                            <Col sm={3}>
                                <Button color="primary" onClick={this.handlePaymentRequest} disabled={iframe_payment.view||iframe_payment.complete}>
                                    Proceder al pago
                                </Button>
                            </Col>
                            <Col sm={3}>
                                <Button color="success" onClick={this.handleComplete} disabled={iframe_payment.complete||iframe_payment.id===null}>
                                    Confirmar pago
                                </Button>
                            </Col>
                            </>:<Col sm={12}></Col>}
                            {sale_payment.payment_method_data !== null && sale_payment.payment_method_data.store_card_charge?
                            <>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Monedero#</Label>
                                    <InputGroup>
                                        <Input type="number"
                                            bsSize="sm"
                                            name="card_key"
                                            value={card_key}
                                            onChange={this.onChangeValueCardKey}
                                            disabled={sale_payment.id?true:false}/>
                                        <Input type="password"
                                            bsSize="sm"
                                            placeholder='NIP'
                                            name="nip"
                                            value={nip}
                                            onChange={this.onChangeValueNip}
                                            disabled={sale_payment.id?true:false}/>
                                        <Button size='sm'
                                            color='primary'
                                            onClick={this.handleSearchStoreCard}
                                            disabled={sale_payment.id?true:false}>
                                            <i className="bi bi-credit-card-2-front-fill"></i>
                                        </Button>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                            {sale_payment.store_card_charge_data?
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Nombre</Label>
                                    <InputGroup>
                                        <Input type="text"
                                            bsSize="sm"
                                            value={sale_payment.store_card_charge_data?sale_payment.store_card_charge_data.store_card_name:""}
                                            disabled/>
                                    </InputGroup>
                                </FormGroup>
                            </Col>:<></>}
                            </>:<Col sm={12}></Col>}
                            {sale_payment.id !== null && sale_payment.room_charge_data !== null?
                            <>
                            <Col sm={12} className='border-top pt-3'><h6>Cargo habitación</h6></Col>
                            <Col sm={4} >
                                <FormGroup>
                                    <Label size='sm'>Fecha</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={moment(sale_payment.room_charge_data.timestamp).format('LLL')}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>ID reservación</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={sale_payment.room_charge_data.reservation_opera_id}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Cve hotel</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={sale_payment.room_charge_data.hotel_code}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>No. habitación</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={sale_payment.room_charge_data.room}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Cve servicio</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={sale_payment.room_charge_data.account}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Pax</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={sale_payment.room_charge_data.pax}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Info</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        disabled
                                        value={sale_payment.room_charge_data.coupon}/>
                                </FormGroup>
                            </Col>
                            </>
                            :<Col></Col>}
                        </Row>
                    </Form>:<></>}
				</ModalBody>
				<ModalFooter>
                    <h5 className={new_payments_total===0.00?"text-success":"text-danger"}>
                        <Badge color={new_payments_total===0.00?"success":"danger"}>Saldo</Badge>
                        {'  '}
                        {this.currencyFormat(new_payments_total)}
                    </h5>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='service-form' disabled={this.check_payment_credit(sale_id,sale_payment,iframe_payment)||this.check_payment_store_card(sale_id,sale_payment)}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalSalePayment {...props} history={history} />;
}