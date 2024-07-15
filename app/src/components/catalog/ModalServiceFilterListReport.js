import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import axios from "axios";
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
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
                date:"",
                type:"include_commission_cost",
                print_due:false,
                file:"pdf",
                services:[],
                providers:[],
            },
            options_services: [],
            options_providers: [],
            property:null,
            modal_properties:{
                type:'property',
                isopen:true,
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
        });
    }

    isDataChange(prev_data, new_data){
        if(prev_data.open !== new_data.open)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data) || prevState.property !== this.state.property) {
			this.reset(this.props.data);
		}
	}

	reset(data){
        let params = data.params!==undefined?data.params:this.state.params;
        let open = data.open!==undefined?data.open:this.state.open;
        let date = data.date!==undefined?data.date:params.date;
        this.setState(
            (prev_State) =>{
                return {
                    ...prev_State,
                    params:{
                        ...params,
                        date:date,
                        services: [],
                        providers: [],
                    },
                    options_services: [],
                    options_providers: [],
                    open: open,
                };
            }
        );
        axios.get(`${ApiUrl}general/providers/?limit=500`)
        .then(res => {
            this.setState({
                options_providers:res.data.results.map((provider)=>{return {id:provider.id,name:provider.name}})
            });
        });
        axios.get(`${ApiUrl}general/services_list/?properties=${this.state.property}&limit=1000`)
        .then(res => {
            this.setState({
                options_services:res.data.results.map((service)=>{return {id:service.id,name:service.name}})
            });
        });
	}

    handleClose = (event) => {
        this.setState(
            (prev_State) => {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: true,
                        value: null,
                    },
                    property:null
                };
            }
        );
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
                    property:null
                },
            };
        });
	}

	onSubmit(e){
        e.preventDefault();
        var url = `${ApiSalesUrl}service_report_print/?`;
        url = url + `date=${this.state.params.date}`;
        url = url + `&file=${this.state.params.file}`;
        url = url + `&type=${this.state.params.type}`;
        url = url + `&property=${this.state.property}`;
        url = url + `&print_due=${this.state.params.print_due}`;
        url = url + `&services=${this.state.params.services.toString()}`;
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

	render(){
		const { params, open, options_services, options_providers, modal_properties, property} = this.state;
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
				keyboard={false}
                scrollable>
				<ModalHeader className="text-center">SERVICIOS</ModalHeader>
				<ModalBody style={{maxHeight: '500px', overflowY: 'auto'}}>
					<Form onSubmit={this.onSubmit} id="filter-form" >
                        <Row>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Fecha
                                    </Label>
                                    <Input type='date'
                                        name="date"
                                        placeholder="Fecha"
                                        required
                                        value={params.date}
                                        onChange={this.onChangeValue}
                                        />
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadio}>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'include_commission_cost'}
                                            checked={params.type==="include_commission_cost"}/>
                                        <Label check>
                                            Incluir comisiones/costo
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'exclude_commission'}
                                            checked={params.type==="exclude_commission"}/>
                                        <Label check>
                                            Excluir comisiones
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'just_commission'}
                                            checked={params.type==="just_commission"}/>
                                        <Label check>
                                            Solo comisión Rep
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadio}>
                                    <legend>
                                        <h5>Tipo de documento</h5>
                                    </legend>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'pdf'}
                                            checked={params.file==="pdf"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-pdf-fill"></i>
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'excel'}
                                            checked={params.file==="excel"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-excel-fill"></i>
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <UncontrolledAccordion defaultOpen="1">
                                    {options_services.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="1">
                                            Servicios&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="services"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.services.length===0}/>
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
                                        <AccordionBody accordionId="1">
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
                                    {options_providers.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="2">
                                            Proveedores&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="providers"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.providers.length===0}/>
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
                                        <AccordionBody accordionId="2">
                                            <Row>
                                            {options_providers.map((option_provider, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="providers"
                                                            value={option_provider.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.providers,option_provider)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_provider.name}
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
                            <Col sm={4}>
                                <FormGroup switch className="mb-2">
                                    <Input type="switch" 
                                        name="print_due"
                                        checked={params.print_due}
                                        onChange={this.onChangeSwitchValue}/>
                                    <Label check>Imprimir vigencia</Label>
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
    return <ModalSaleFilterListReport {...props} history={history} />;
}