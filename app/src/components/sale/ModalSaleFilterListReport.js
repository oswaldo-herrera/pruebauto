import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import { getTitle, getVisibleField, getFormatEnable } from './SaleFilterModel';
class ModalSaleFilterListReport extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueCheck = this.onChangeValueCheck.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeValueRadioClear = this.onChangeValueRadioClear.bind(this);
        this.onChangeValueRadio = this.onChangeValueRadio.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                start_date:"",
                due_date:"",
                date_filter:"",
                refunds_only:false,
                just_import:false,
                summary:false,
                file:"pdf",
                type:"",
                with_out_tax:false,
                hotels:[],
                providers:[],
                services:[],
                sale_types:[],
                representatives:[],
            },
            options_hotels: [],
            options_providers: [],
            options_services: [],
            options_sale_types: [],
            options_representatives: [],
            user_extension:null,
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

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.name]:value,
                },
            };
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

    onChangeValueRadioClear(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:[],
                },
            };
        });
    }

    onChangeValueRadio(event) {
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
        let refunds_only = data.refunds_only!==undefined?data.refunds_only:params.refunds_only;
        let user_extension = data.user_extension!==undefined?data.user_extension:this.state.user_extension;
        if(start_date!==""&&due_date!==""){
            axios.get(`${ApiSalesUrl}sale_report_list_filters/?start_date=${start_date}&due_date=${due_date}&date_filter=${date_filter}&refunds_only=${refunds_only}&property=${this.state.property}`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                        return {
                            ...prev_State,
                            params:{
                                ...params,
                                start_date:start_date,
                                due_date:due_date,
                                hotels:[],
                                services:[],
                                sale_types:[],
                                representatives:[],
                                providers:[],
                            },
                            user_extension:user_extension,
                            options_hotels: res.data.hotels,
                            options_services: res.data.services,
                            options_sale_types: res.data.sale_types,
                            options_representatives: res.data.representatives,
                            options_providers: res.data.providers,
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
                            hotels: [],
                            services:[],
                            sale_types: [],
                            representatives:[],
                            providers:[],
                        },
                        user_extension:user_extension,
                        options_hotels: [],
                        options_services: [],
                        options_sale_types: [],
                        options_representatives: [],
                        options_providers: [],
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
        var url = `${ApiSalesUrl}sale_report_print/?`;
        url = url + `start_date=${this.state.params.start_date}&due_date=${this.state.params.due_date}`;
        url = url + `&file=${this.state.params.file}`;
        url = url + `&with_out_tax=${this.state.params.with_out_tax}`;
        url = url + `&date_filter=${this.state.params.date_filter}`;
        url = url + `&type=${this.state.params.type}`;
        url = url + `&just_import=${this.state.params.just_import}`;
        url = url + `&summary=${this.state.params.summary}`;
        url = url + `&property=${this.state.property}`;
        url = url + `&hotels=${this.state.params.hotels.toString()}`;
        url = url + `&services=${this.state.params.services.toString()}`;
        url = url + `&sale_types=${this.state.params.sale_types.toString()}`;
        url = url + `&representatives=${this.state.params.representatives.toString()}`;
        url = url + `&providers=${this.state.params.providers.toString()}`;
        window.open(url, "_blank");
	}

    checkedMarkElement(selected,option){
        if(selected.length > 0){
            let value = selected.find((selecte)=>selecte===option.id+"")
            return value !== undefined;
        } else {
            return false;
        }
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

    getFilterView(){
        if(this.state.params.type==="report_by_payment_method"){
            let permision = this.state.user_extension.permissions.find((permision)=>permision=="SalesApp.access_report_by_payment_method");
            return permision !== undefined || this.state.user_extension.user.is_superuser == true;
        }
        return true;
    }
    
	render(){
		const { params, open, property, user_extension, options_hotels, options_services, options_sale_types, options_representatives, options_providers, modal_properties } = this.state;
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
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
				keyboard={false}
                scrollable>
				<ModalHeader className="text-center">{getTitle(params.type)}</ModalHeader>
				<ModalBody style={{maxHeight: '500px', overflowY: 'auto'}}>
					<Form onSubmit={this.onSubmit} id="filter-form" >
                        <Row>
                            <Col sm={4}>
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
                            <Col sm={4}>
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
                            {this.getFilterView()?<>
                            {getVisibleField("date_filter",params.type)?
                            <Col sm={4}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadio}>
                                    <legend>
                                        <h5>Filtro por</h5>
                                    </legend>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="date_filter"
                                            value={'xFechaVenta'}
                                            checked={params.date_filter=="xFechaVenta"}/>
                                        <Label check>
                                            Fecha Venta
                                            <i className="bi bi-receipt"></i>
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="date_filter"
                                            value={'xFechaServicio'}
                                            checked={params.date_filter=="xFechaServicio"}/>
                                        <Label check>
                                            Fecha Servicio
                                            <i className="bi bi-briefcase"></i>
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            :<></>}</>:<></>}
                            <Col sm={6}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadio}>
                                    <legend>
                                        <h5>Tipo de documento</h5>
                                    </legend>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'pdf'}
                                            checked={params.file=="pdf"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-pdf-fill"></i>
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'excel'}
                                            disabled={!getFormatEnable(params.type)}
                                            checked={params.file=="excel"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-excel-fill"></i>
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            {this.getFilterView()?<>
                            <Col sm={12}>
                                <UncontrolledAccordion defaultOpen="1">
                                    {options_sale_types.length > 0 && getVisibleField("sale_types",params.type)?
                                    <AccordionItem>
                                        <AccordionHeader targetId="1">
                                            Tipos de ventas&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="sale_types"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.sale_types.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="sale_types"
                                                    disabled
                                                    checked={params.sale_types.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="1">
                                            <Row>
                                            {options_sale_types.map((option_sale_type, index)=>(
                                                <Col sm={4}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="sale_types"
                                                            value={option_sale_type.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.sale_types,option_sale_type)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_sale_type.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_hotels.length > 0 && getVisibleField("hotels",params.type)?
                                    <AccordionItem>
                                        <AccordionHeader targetId="2">
                                            Hotel&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="hotels"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.hotels.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="hotels"
                                                    disabled
                                                    checked={params.hotels.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="2">
                                            <Row>
                                            {options_hotels.map((option_hotel, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="hotels"
                                                            value={option_hotel.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.hotels,option_hotel)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_hotel.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_services.length > 0 && getVisibleField("services",params.type)?
                                    <AccordionItem>
                                        <AccordionHeader targetId="2">
                                            Servicio&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="services"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.services.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="services"
                                                    disabled
                                                    checked={params.services.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="2">
                                            <Row>
                                            {options_services.map((option_service, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="services"
                                                            value={option_service.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.services,option_service)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_service.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_representatives.length > 0 && getVisibleField("representatives",params.type)?
                                    <AccordionItem>
                                        <AccordionHeader targetId="3">
                                            Representante&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="representatives"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.representatives.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="representatives"
                                                    disabled
                                                    checked={params.representatives.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="3">
                                            <Row>
                                            {options_representatives.map((options_representative, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="representatives"
                                                            value={options_representative.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.representatives,options_representative)}/>
                                                            {' '}
                                                        <Label check>
                                                            {options_representative.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_providers.length > 0 && getVisibleField("providers",params.type)?
                                    <AccordionItem>
                                        <AccordionHeader targetId="3">
                                            Proveedor&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="providers"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.providers.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="providers"
                                                    disabled
                                                    checked={params.providers.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="3">
                                            <Row>
                                            {options_providers.map((options_provider, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="providers"
                                                            value={options_provider.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.providers,options_provider)}/>
                                                            {' '}
                                                        <Label check>
                                                            {options_provider.name}
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
                            {getVisibleField("just_import",params.type)?
                            <Col sm={4}>
                                <FormGroup switch className="mb-2">
                                    <Input type="switch" 
                                        name="just_import"
                                        checked={params.just_import}
                                        onChange={this.onChangeSwitchValue}/>
                                    <Label check>Solo importe</Label>
                                </FormGroup>
                            </Col>
                            :<></>}
                            {getVisibleField("with_out_tax",params.type)?
                            <Col sm={4}>
                                <FormGroup switch className="mb-2">
                                    <Input type="switch" 
                                        name="with_out_tax"
                                        checked={params.with_out_tax}
                                        onChange={this.onChangeSwitchValue}/>
                                    <Label check>Sin IVA</Label>
                                </FormGroup>
                            </Col>
                            :<></>}
                            {getVisibleField("summary",params.type)?
                            <Col sm={4}>
                                <FormGroup switch className="mb-2">
                                    <Input type="switch" 
                                        name="summary"
                                        checked={params.summary}
                                        onChange={this.onChangeSwitchValue}/>
                                    <Label check>Resumen?</Label>
                                </FormGroup>
                            </Col>
                            :<></>}
                            </>:<></>}
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
    return <ModalSaleFilterListReport {...props} history={history} />;
}