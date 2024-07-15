import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ModalSaleFilterSapReport extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueCheck = this.onChangeValueCheck.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeValueRadio = this.onChangeValueRadio.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                start_date:"",
                due_date:"",
                date_filter:"",
                title:"",
                transfer_service:false,
                with_out_tax:false,
                sap_codes:"-RCD",
                currency:"USD",
            },
            options_sap_codes: [],
            property:null,
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"VP",
                value:null
            },
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.target.name]:event.target.value,
				},
			};
		},()=>{
            this.reset(this.state);
        }); 
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeValueCheck(event) {
        let values = this.state.params[event.target.name];
        if(!Array.isArray(values)){
            values = []
        }
        if(event.target.checked){
            values.push(event.target.value)
        } else {
            const index = values.indexOf(event.target.value);
            if (index > -1) { // only splice array when item is found
                values.splice(index, 1); // 2nd parameter means remove one item only
            }
        }
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:values,
                },
            };
        });
    }

    onChangeValueRadio(event) {
        let value = "";
        switch(event.target.name){
            case "sap_codes":
                if(event.target.value === "all"){
                    value = [];
                } else{
                    value = event.target.value;
                }
                break;
            default:
                value = event.target.value;
                break;
        }
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:value,
                },
            };
        },()=>{
            this.reset(this.state);
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
        if(prev_data.start_date !== new_data.start_date)
			return true
        if(prev_data.due_date !== new_data.due_date)
			return true
        if(prev_data.open !== new_data.open)
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
            if(prevProps.data.open !== this.props.data.open && this.props.data.open === true){
                this.setState(
                    (prev_State) =>{
                        return {
                            ...prev_State,
                            modal_properties:{
                                ...prev_State.modal_properties,
                                isopen:true,
                            },
                        };
                    }
                );
            }
		}
	}

	reset(data){
        let params = data.params!==undefined?data.params:this.state.params;
        let open = data.open!==undefined?data.open:this.state.open;
        let property = data.property!==undefined?data.property:this.state.property;
        let start_date = data.start_date!==undefined?data.start_date:params.start_date;
        let due_date = data.due_date!==undefined?data.due_date:params.due_date;
        let date_filter = data.date_filter!==undefined?data.date_filter:params.date_filter;
        let currency = data.currency!==undefined?data.currency:params.currency;
        let transfer_service = data.transfer_service!==undefined?data.transfer_service:params.transfer_service;
        if(start_date!==""&&due_date!==""){
            axios.get(`${ApiSalesUrl}sale_report_sap_filters/?transfer_service=${transfer_service}&start_date=${start_date}&due_date=${due_date}&date_filter=${date_filter}&currency=${currency}&property=${this.state.property}`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                        return {
                            ...prev_State,
                            params:{
                                ...params,
                                start_date:start_date,
                                due_date:due_date,
                                date_filter:date_filter,
                                transfer_service:transfer_service,
                                currency:currency,
                            },
                            options_sap_codes: res.data.sap_codes,
                            open: open,
                            property: property,
                        };
                    }
                );
            });
        } else {
            this.setState(
                (prev_State) =>{
                    return {
                        ...prev_State,
                        params:{
                            ...params,
                            start_date:start_date,
                            due_date:due_date,
                            date_filter:date_filter,
                            transfer_service:transfer_service,
                            with_out_tax:false,
                            sap_codes:"-RCD",
                            currency:"USD",
                        },
                        options_sap_codes: [],
                        open: open,
                        property: property,
                    };
                }
            );
        }
        
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}
    
    handleAsignment = (value) => {
        this.setState(
            (prev_State) => {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    property:value
                };
            }
        );
	}

    handlePropertyClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: false,
                },
            };
        });
	}

	onSubmit(e){
        e.preventDefault();
        var url = `${ApiSalesUrl}sale_report_sap_print/?`;
        url = url + `start_date=${this.state.params.start_date}&due_date=${this.state.params.due_date}`;
        url = url + `&transfer_service=${this.state.params.transfer_service}`;
        url = url + `&with_out_tax=${this.state.params.with_out_tax}`;
        url = url + `&sap_codes=${this.state.params.sap_codes}`;
        url = url + `&currency=${this.state.params.currency}`;
        url = url + `&property=${this.state.property}`;
        window.open(url, "_blank");
	}

    checkedMarkElement(selected,option){
        if(Array.isArray(selected)){
            if(selected.length > 0){
                let value = selected.find((selecte)=>selecte===option.id+"")
                return value !== undefined;
            }
        }
        return false;
    }

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "representative":
                options = this.state.options_representatives;
                break;
        }
        value = options.find((option)=>option.value===this.state.params[field]);
        return value;
    }
    
	render(){
		const { params, open, property, options_sap_codes, modal_properties } = this.state;
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}
                scrollable>
				<ModalHeader className="text-center">{params.title}</ModalHeader>
				<ModalBody style={{maxHeight: '500px', overflowY: 'auto'}}>
					<Form onSubmit={this.onSubmit} id="filter-form" >
                        <Row>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Fecha inicio
                                    </Label>
                                    <Input type='date'
                                        name="start_date"
                                        placeholder="Fecha inicio"
                                        required
                                        value={params.start_date}
                                        onChange={this.onChangeValue}
                                        />
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Fecha fin
                                    </Label>
                                    <Input type='date'
                                        name="due_date"
                                        placeholder="Fecha fin"
                                        required
                                        value={params.due_date}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <UncontrolledAccordion>
                                    {options_sap_codes.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="1">
                                            <FormGroup tag="fieldset"
                                                    onChange={this.onChangeValueRadio}>
                                                <FormGroup check inline>
                                                    <Input type="radio"
                                                        name="sap_codes"
                                                        value={'-RCD'}
                                                        checked={params.sap_codes==="-RCD"}/>
                                                    <Label check className='mt-1'>
                                                        Sin RCD
                                                    </Label>
                                                </FormGroup>
                                                <FormGroup check inline>
                                                    <Input type="radio"
                                                        name="sap_codes"
                                                        value={'RCD'}
                                                        checked={params.sap_codes==="RCD"}/>
                                                    <Label check className='mt-1'>
                                                        RCD
                                                    </Label>
                                                </FormGroup>
                                                <FormGroup check inline>
                                                    <Input type="radio"
                                                        name="sap_codes"
                                                        value={'all'}
                                                        checked={Array.isArray(params.sap_codes) && params.sap_codes.length==0}/>
                                                    <Label check className='mt-1'>
                                                        Todos
                                                    </Label>
                                                </FormGroup>
                                                <FormGroup check inline>
                                                    <Input type="radio"
                                                        name="sap_codes"
                                                        disabled
                                                        checked={Array.isArray(params.sap_codes) && params.sap_codes.length>0}/>
                                                    <Label check className='mt-1'>
                                                        Algunos
                                                    </Label>
                                                </FormGroup>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="1">
                                            <Row>
                                            {options_sap_codes.map((option_sap_code, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="sap_codes"
                                                            value={option_sap_code.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.sap_codes,option_sap_code)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_sap_code.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                </UncontrolledAccordion>
                            </Col>
                            <Col sm={12}>
                                <FormGroup tag="fieldset"
                                        onChange={this.onChangeValueRadio}>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="currency"
                                            value={'USD'}
                                            checked={params.currency=="USD"}/>
                                        <Label check className='mt-1'>
                                            USD
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="currency"
                                            value={'MN'}
                                            checked={params.currency=="MN"}/>
                                        <Label check className='mt-1'>
                                            MXN
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="currency"
                                            value={''}
                                            checked={params.currency==""}/>
                                        <Label check className='mt-1'>
                                            Ambas monedas
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup switch className="mb-2">
                                    <Input type="switch" 
                                        name="with_out_tax"
                                        checked={params.with_out_tax}
                                        onChange={this.onChangeSwitchValue}/>
                                    <Label check>Sin IVA</Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
				</ModalBody>
				<ModalFooter>
                    {open?
                    <ModalPropertiesAsignment handleAsignment={this.handleAsignment} handleClose={this.handlePropertyClose} data={modal_properties} />
                    :<></>}
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='filter-form' disabled={property===null}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
        </>)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalSaleFilterSapReport {...props} history={history} />;
}