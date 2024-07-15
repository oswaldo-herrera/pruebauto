import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, InputGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import TabComponent from '../TabComponent';
import ServiceGallery from './ServiceGallery';
import ServiceRateList from './ServiceRateList';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ServiceForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueServiceFee = this.onChangeValueServiceFee.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                code: "",
                name: "",
                provider: null,
                activity: null,
                opera_code: "",
                description_po: "",
                description_es: "",
                description_en: "",
                is_transfer: false,
                is_sale_online: false,
                name_online_sale_es: "",
                name_online_sale_en: "",
                comments_coupon: "",
                service_fee_amount: "20,",
                service_fee: null,
                business_group: null,
                availability_group: null,
                is_colective: false,
                zones: "",
            },
            service_fee_amount: {
                amount_1:20,
                amount_2:0,
                amount_3:0,
            },
            options_providers: [],
            options_activities: [],
            options_business_groups: [],
            options_availability_groups: [],
            options_units: [],
            options_services: [],
            modal:{
                title: "Servicio",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'properties',
                isopenonproperties:true,
                isopen:false,
                value:[]
            },
            tabs:[]
        }
        
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.name]:value,
				},
			};
		});
    }

    onChangeValueServiceFee(event) {
        this.setState(function (prevState) {
            return {
                service_fee_amount: {
                    ...prevState.service_fee_amount,
                    [event.target.name]:event.target.value,
                },
            };
        },()=>{
            let value = ""
            if(this.state.service_fee_amount.amount_1){
                value += this.state.service_fee_amount.amount_1+",";
            }
            if(this.state.service_fee_amount.amount_2){
                value += this.state.service_fee_amount.amount_2+",";
            }
            if(this.state.service_fee_amount.amount_3){
                value += this.state.service_fee_amount.amount_3;
            }
            this.setState(function (prevState) {
                return {
                    data: {
                        ...prevState.data,
                        service_fee_amount:value,
                    },
                };
            });
        });
    }

    onSubmit(e){
        e.preventDefault();
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: true,
                },
            };
        });
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

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    data:{
                        ...prev_State.data,
                        properties:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}general/services/${this.state.id}/`, this.state.data)
                .then(res => {
                    this.reset(res.data.id);
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                        };
                    });
                }).catch(this.catchDateError);
        } else {
            axios.post(`${ApiUrl}general/services/`, this.state.data)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Guardado exitoso!",
                            },
                        };
                    });
                    this.props.history('/catalogs/service/'+res.data.id)
                }).catch(this.catchDateError);
        }
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
                };
            });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
		this.reset(id);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    tabsComponent(id){
        return [
            {
                key:0,
                title: "Tarifario",
                component: <ServiceRateList service={id} />,
            },
            {
                key:1,
                title: "Galeria",
                component: <ServiceGallery service={id} />,
            }
        ]
    }

    reset(id){
        if (id !== null){
            axios.get(`${ApiUrl}general/services/${id}/`)
            .then(res => {
                let service_fee_amount = {
                    amount_1:0,
                    amount_2:0,
                    amount_3:0,
                }
                let service_fee_amount_array = res.data.service_fee_amount.split(",");
                switch(service_fee_amount_array.length){
                    case 3:
                        service_fee_amount.amount_1 = parseFloat(service_fee_amount_array[0]);
                        service_fee_amount.amount_2 = parseFloat(service_fee_amount_array[1]);
                        service_fee_amount.amount_3 = parseFloat(service_fee_amount_array[2]);
                        break;
                    default:
                        service_fee_amount.amount_1 = parseFloat(service_fee_amount_array[0]);
                }
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        data:res.data,
                        service_fee_amount:service_fee_amount,
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.data.properties,
                            properties_data:res.data.properties_data,
                        },
                        tabs:this.tabsComponent(id)
                    };
                });
               this.options_load();
            });
        } else {
            this.setState({
                id:null,
                data:{
                    code: "",
                    name: "",
                    provider: null,
                    activity: null,
                    opera_code: "",
                    description_po: "",
                    description_es: "",
                    description_en: "",
                    is_transfer: false,
                    comments_coupon: "",
                    service_fee_amount: "20,",
                    service_fee: null,
                    business_group: null,
                    availability_group: null,
                    is_colective: false,
                    zones: "",
                },
                service_fee_amount: {
                    amount_1:20,
                    amount_2:0,
                    amount_3:0,
                },
                modal_properties:{
                    type:'properties',
                    isopenonproperties:true,
                    isopen:false,
                    value:[]
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/activities/?limit=500`)
        .then(res => {
            this.setState({
                options_activities:res.data.results.map((activity)=>{return {value:activity.id,label:activity.name}})
            });
        });
        axios.get(`${ApiUrl}general/business_groups/?limit=500`)
        .then(res => {
            this.setState({
                options_business_groups:res.data.results.map((business_group)=>{return {value:business_group.id,label:business_group.name}})
            });
        });
        axios.get(`${ApiUrl}general/availability_groups/?limit=500`)
        .then(res => {
            this.setState({
                options_availability_groups:res.data.results.map((availability_group)=>{return {value:availability_group.id,label:availability_group.name}})
            });
        });
        axios.get(`${ApiUrl}general/providers/?limit=500`)
        .then(res => {
            this.setState({
                options_providers:res.data.results.map((provider)=>{return {value:provider.id,label:provider.name}})
            });
        });
        axios.get(`${ApiUrl}general/units/?limit=500&is_private=true`)
        .then(res => {
            this.setState({
                options_units:res.data.results.map((unit)=>{return {value:unit.id,label:unit.code + " - " + unit.name}})
            });
        });
        axios.get(`${ApiUrl}general/services/?limit=500`)
        .then(res => {
            this.setState({
                options_services:res.data.results.filter((service)=>service.id!==parseInt(this.state.id)).map((service)=>{return {value:service.id,label:service.name}})
            });
        });
        this.setState({
            service_fee_amount: this.state.data.service_fee_amount.split(",")
        })
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

    handleCloseAddMore = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                id:null
            };
        });
        this.reset(null);
        this.props.history('/catalogs/service/')
	}

    handleCloseError = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
	}

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "provider":
                options = this.state.options_providers;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "activity":
                options = this.state.options_activities;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "business_group":
                options = this.state.options_business_groups;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "availability_group":
                options = this.state.options_availability_groups;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "unit":
                options = this.state.options_units;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "service_fee":
                options = this.state.options_services;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
        }
        return value;
    }

    render(){
        const { id, data, modal, modal_properties, service_fee_amount, options_providers,
            options_activities, options_business_groups, options_services,
            options_availability_groups, options_units, tabs } = this.state;
        const select_option_provider = this.getOptionValue("provider");
        const select_option_activity = this.getOptionValue("activity");
        const select_option_business_group = this.getOptionValue("business_group");
        const select_option_availability_group = this.getOptionValue("availability_group");
        const select_option_unit = this.getOptionValue("unit");
        const select_option_service_fee = this.getOptionValue("service_fee");

        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        {data.is_transfer?
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Clave</Label>
                                <Input type="text" 
                                    name="code"
                                    placeholder="Clave" 
                                    value={data.code}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        :<></>}
                        <Col sm={5}>
                            <FormGroup>
                                <Label>Nombre</Label>
                                <Input type="text" 
                                    name="name"
                                    placeholder="Nombre" 
                                    value={data.name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Código OPERA</Label>
                                <Input type="text" 
                                    name="opera_code"  
                                    placeholder="Código OPERA" 
                                    value={data.opera_code}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="is_transfer"
                                    checked={data.is_transfer}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Servicio de traslado?</Label>
                            </FormGroup>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="is_online_used"
                                    checked={data.is_online_used}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Se usa para reservación online?</Label>
                            </FormGroup>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="is_sale_online"
                                    checked={data.is_sale_online}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Se usa en portal de ventas?</Label>
                            </FormGroup>
                        </Col>
                        {data.is_sale_online?<>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Nombre Portal de Ventas Español</Label>
                                <Input type="text" 
                                    name="name_online_sale_es"
                                    placeholder="Nombre Portal de Ventas Español" 
                                    value={data.name_online_sale_es}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Nombre Portal de Ventas Ingles</Label>
                                <Input type="text" 
                                    name="name_online_sale_en"
                                    placeholder="Nombre Portal de Ventas Ingles" 
                                    value={data.name_online_sale_en}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col></>:<></>}
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Proveedor</Label>
                                <Select
                                    options={options_providers}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="provider"
                                    value={select_option_provider}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Actividad</Label>
                                <Select
                                    options={options_activities}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="activity"
                                    value={select_option_activity}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Grupo de negocio</Label>
                                <Select
                                    options={options_business_groups}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="business_group"
                                    value={select_option_business_group}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Grupo de disponibilidad</Label>
                                <Select
                                    options={options_availability_groups}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="availability_group"
                                    value={select_option_availability_group}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <Label>Service Fee</Label>
                            <FormGroup>
                                <Select
                                    options={options_services}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="service_fee"
                                    value={select_option_service_fee}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        {data.service_fee!==null?
                        <Col sm={4}>
                            <Label>Monto Service Fee</Label>
                            <InputGroup className='mb-2'>
                                <Input type="number" 
                                    name="amount_1"
                                    value={service_fee_amount.amount_1}
                                    onChange={this.onChangeValueServiceFee}/>
                                <Input type="number" 
                                    name="amount_2"
                                    value={service_fee_amount.amount_2}
                                    onChange={this.onChangeValueServiceFee}/>
                                <Input type="number" 
                                    name="amount_3"
                                    value={service_fee_amount.amount_3}
                                    onChange={this.onChangeValueServiceFee}/>
                            </InputGroup>
                        </Col>:<></>}
                        {data.is_transfer?<>
                        <Col sm={4}>
                            <FormGroup switch className='mb-2'>
                                <Input type="switch" 
                                    name="is_colective"
                                    checked={data.is_colective}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Es un servicio colectivo?</Label>
                            </FormGroup>
                            {data.is_colective?<></>:
                            <FormGroup>
                                <Select
                                    options={options_units}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder="Unidad" 
                                    name="unit"
                                    value={select_option_unit}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>}
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Zonas</Label>
                                <Input type="text" 
                                    name="zones"  
                                    placeholder="Zonas" 
                                    value={data.zones}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        </>:<></>}
                        {data.is_transfer?
                        <></>:
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Tips de servicio</Label>
                                <Input type="textarea" 
                                    name="comments_coupon"  
                                    placeholder="Tips de servicio" 
                                    value={data.comments_coupon}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>}
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Descripción en ingles</Label>
                                <Input type="textarea" 
                                    name="description_en"  
                                    placeholder="Descripción en ingles" 
                                    value={data.description_en}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Descripción en español</Label>
                                <Input type="textarea" 
                                    name="description_es"  
                                    placeholder="Descripción en español" 
                                    value={data.description_es}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Descripción en portugues</Label>
                                <Input type="textarea" 
                                    name="description_po"  
                                    placeholder="Descripción en portugues" 
                                    value={data.description_po}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup className='border-top pt-3'>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
                {id?<TabComponent currentTab={"0"} tabs={tabs} className="border-top pt-3"/>
                :<></>}
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ServiceForm {...props} params = {params} history={history} />;
}