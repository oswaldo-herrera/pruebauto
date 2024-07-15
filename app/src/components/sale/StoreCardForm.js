import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, CardGroup, Card, CardHeader, CardBody, CardTitle, CardText, Table, ButtonGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import Select from 'react-select';
import StoreCardChargeList from './StoreCardChargeList';
import TabComponent from '../TabComponent';
class StoreCardForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                store: null,
                name_pax: "",
                email: "",
                due_date:"",
                status:"active",
                comments:"",
            },
            options:[],
            modal:{
                title: "Tarifa",
                type: 'success',
                message: null,
            },
            tabs:[]
        }
    }

    onClearInput(field){
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    [field]:null,
                },
            };
        });
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

    onSubmit(e){
        e.preventDefault();
        if (this.state.id !== null) {
            axios.put(`${ApiSalesUrl}store_cards/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiSalesUrl}store_cards/`, this.state.data)
                .then(res => {
                    this.reset(res.data.id);
                    if(window.confirm(`¿Desea enviar esta monedero por correo?`)){
                        this.sendStoreCardEmail(res.data.id);
                        this.props.history('/store_card/'+res.data.id);
                    } else {
                        this.props.history('/store_card/'+res.id);
                    }
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Guardado exitoso!",
                            },
                        };
                    });
                }).catch(this.catchDateError);
        }
    }

    sendStoreCardEmail(id){
        axios.get(`${ApiSalesUrl}store_card_send_email/${id}/`)
        .then(res => {
            alert("Se ha enviado el correo.");
        });
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

    reset(id){
        if(id !== null){
            axios.get(`${ApiSalesUrl}store_cards/${id}/`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        data:res.data,
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.data.property,
                        },
                        tabs:this.tabsComponent(id)
                    };
                });
                this.options_load();
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:id,
                    data: {
                        ...prev_State.data,
                        store: null,
                        name_pax: "",
                        email: "",
                        due_date:"",
                        status:"active",
                        initial_import:0,
                        comments:"",
                    },
                    modal_properties:{
                        type:'property',
                        isopen:false,
                        value:null
                    },
                };
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/stores/?limit=500`)
        .then(res => {
            this.setState({
                options:res.data.results.map((unit)=>{return {value:unit.id,label:unit.code + " - " + unit.name}})
            });
        });
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
        if(this.props.handleSave)
            this.props.handleSave();
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
        let value = this.state.options.find((option)=>option.value===this.state.data[field]);
        return value?value:null;
    }

    tabsComponent(id){
        return [
            {
                key:0,
                title: "Transacciones de monedero",
                component: <StoreCardChargeList store_card={id} />,
            },
        ]
    }

    render(){
        const { id,data,options,modal, tabs } = this.state;
        const select_option_store = this.getOptionValue('store');
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Nombre</Label>
                                <Input type="text" 
                                    name="name_pax"
                                    placeholder="Nombre" 
                                    value={data.name_pax}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Correo</Label>
                                <Input type="text" 
                                    name="email"
                                    placeholder="Correo" 
                                    value={data.email}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Fecha de vencimiento</Label>
                                <Input type="date" 
                                    name="due_date"
                                    placeholder="Fecha de vencimiento" 
                                    value={data.due_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Estatus</Label>
                                <Input type="select" 
                                    name="status"  
                                    placeholder="Estatus" 
                                    value={data.status}
                                    onChange={this.onChangeValue}>
                                        <option value={'active'}>Activa</option>
                                        <option value={'inactive'}>Inactiva</option>
                                        <option value={'lost'}>Perdida</option>
                                </Input>
                            </FormGroup>
                        </Col>
                        {id?<></>:
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Saldo inicial</Label>
                                <Input type="number" 
                                    name="initial_import"
                                    min={0}
                                    value={data.initial_import}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>}
                        {/* <Col sm={4}>
                            <FormGroup>
                                <Label>Tienda</Label>
                                <Select
                                    options={options}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Seleccione tienda"}
                                    name="store"
                                    value={select_option_store}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col> */}
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="comments" size='sm'>Comentarios</Label>
                                <Input type="textarea" 
                                    name="comments"
                                    bsSize="sm" 
                                    placeholder="Comentarios" 
                                    value={data.comments}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>   
                    </Row>
                    <ButtonGroup>
                        <Button variant="primary" type="submit" className='mt-3'>
                            Guardar
                        </Button>
                        {id?
                        <Button color="success" className='mt-3' onClick={(e)=>{this.sendStoreCardEmail(id)}}>
                            Enviar Monedero por correo
                        </Button>:<></>}
                    </ButtonGroup>
                </Form>
                <ModalAlert handleClose={this.handleClose} handleCloseError={this.handleCloseError} data={modal}  />
                {id?<TabComponent currentTab={"0"} tabs={tabs} className="border-top pt-3"/>
                :<></>}
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <StoreCardForm {...props} params = {params} history={history} />;
}