import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, CardImg, Card, CardBody, Placeholder, PlaceholderButton } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import TabComponent from '../TabComponent';
import HotelInstruction from './HotelInstruction';
class HotelForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeFile = this.onChangeFile.bind(this);
        this.handleUploadLogo = this.handleUploadLogo.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                name: "",
                opera_code: "",
                zone_id: "",
                unit: null,
                priority: false,
            },
            logo:"",
            options: [],
            modal:{
                title: "Hotel",
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

    onChangeFile(event) {
        let file_size = event.target.files[0].size;
        file_size = file_size/1000000;
        if(file_size < 5){
            this.setState(function (prevState) {
                return {
                    logo:event.target.files[0],
                };
            });
        } else {
            alert("No se admiten imagenes mayores a 5MB");
        }
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
            axios.put(`${ApiUrl}general/hotels/${this.state.id}/`, this.state.data)
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
                }).catch(this.catchError);
        } else {
            axios.post(`${ApiUrl}general/hotels/`, this.state.data)
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
                    this.props.history('/catalogs/hotel/'+res.data.id)
                }).catch(this.catchError);
        }
    }

    catchError = (error) =>{
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
        } else if(error.response.data.hasOwnProperty('due_date') > -1){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.due_date,
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
                title: "Instrucciones",
                component: <HotelInstruction hotel={id} />,
            }
        ]
    }

    reset(id){
        if (id !== null){
            axios.get(`${ApiUrl}general/hotels/${id}/`)
            .then(res => {
                let logo = res.data.logo;
                delete res.data.logo;
                this.setState(
                    (prev_State) =>{
                        return {
                        id:id,
                        data:res.data,
                        logo:logo,
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
                    name: "",
                    opera_code: "",
                    zone_id: "",
                    unit: null,
                    priority: false,
                },
                logo:"",
                modal_properties:{
                    type:'properties',
                    isopen:false,
                    value:[]
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/units/?limit=500&is_private=false`)
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
        this.props.history('/catalogs/hotels');
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
        this.props.history('/catalogs/hotel/')
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

    handleUploadLogo = () => {
        let form_data = new FormData();
        form_data.append("logo", this.state.logo, this.state.logo.name);
        form_data.append("id", this.state.id);
        if (this.state.id !== null) {
            axios.patch(`${ApiUrl}general/hotels/${this.state.id}/`, form_data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }).finally(()=>this.reset(this.state.id))
        }
    }

    getOptionValue = (field) =>{
        let value = this.state.options.find((option)=>option.value===this.state.data[field]);
        return value?value:null;
    }

    render(){
        const { id,data,modal,modal_properties,options, logo, tabs } = this.state;
        const select_option_unit = this.getOptionValue('unit');
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={8}>
                            <Row>
                                <Col sm={8}>
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
                                <Col sm={4}>
                                    <FormGroup>
                                        <Label>Código OPERA</Label>
                                        <Input type="text" 
                                            name="opera_code"  
                                            placeholder="Código OPERA" 
                                            value={data.opera_code}
                                            onChange={this.onChangeValue}/>
                                    </FormGroup>
                                </Col>
                                <Col sm={4}>
                                    <FormGroup>
                                        <Label>ID Zona</Label>
                                        <Input type="number" 
                                            name="zone_id"  
                                            placeholder="ID Zona" 
                                            value={data.zone_id}
                                            onChange={this.onChangeValue}/>
                                    </FormGroup>
                                </Col>
                                <Col sm={8}>
                                    <FormGroup>
                                        <Label>Unidad</Label>
                                        <Select
                                            options={options}
                                            isClearable={true}
                                            isSearchable={true}
                                            placeholder={"Seleccione unidad"}
                                            name="unit"
                                            value={select_option_unit}
                                            onChange={this.onChangeSelectValue}/>
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup switch>
                                        <Input type="switch" 
                                            name="priority"
                                            checked={data.priority}
                                            onChange={this.onChangeSwitchValue}/>
                                        <Label check>¿Este hotel es prioridad (InterHotel)?</Label>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                        <Col sm={4}>
                            <Card
                                >
                                <CardImg
                                    alt={data.name + " Logo"}
                                    src={logo?logo:"https://picsum.photos/id/135/318/180?grayscale&blur=10"}
                                    top
                                    width="100%"
                                />
                                <CardBody>
                                    {id?<>
                                    <FormGroup>
                                        <Label>Logo</Label>
                                        <Input type="file" 
                                            name="image"  
                                            placeholder="Logo"
                                            onChange={this.onChangeFile}
                                            accept='image/*'/>
                                    </FormGroup>
                                    <Button 
                                        color="success"
                                        disabled={logo===""}
                                        onClick={this.handleUploadLogo}>
                                        Subir logo
                                    </Button></>
                                    :<>
                                    <Placeholder animation="wave">
                                    <Placeholder xs={8} /></Placeholder>
                                    <Placeholder animation="wave">
                                    <Placeholder xs={12} />
                                    <Placeholder xs={7} /></Placeholder>
                                    <PlaceholderButton xs={8} />
                                    </>}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    
                    <FormGroup>
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
    return <HotelForm {...props} params = {params} history={history} />;
}