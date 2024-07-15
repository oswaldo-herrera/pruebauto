import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ServiceGallery from './ServiceGallery';
import ServiceRateList from './ServiceRateList';
import AvailabilityList from './AvailabilityList';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class AvailabilityGroupForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                code: "",
                name: "",
                group: null,
            },
            options_groups: [],
            modal:{
                title: "Grupo de disponibilidad",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'properties',
                isopen:false,
                isopenonproperties:true,
                filter:"VP",
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
            axios.put(`${ApiUrl}general/availability_groups/${this.state.id}/`, this.state.data)
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
                });
        } else {
            axios.post(`${ApiUrl}general/availability_groups/`, this.state.data)
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
                    this.props.history('/catalogs/availability_group/'+res.data.id)
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
            axios.get(`${ApiUrl}general/availability_groups/${id}/`)
            .then(res => {
                this.setState(function (prev_State) {
                    return {
                        id:id,
                        data:res.data,
                        tabs:this.tabsComponent(id),
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.data.properties,
                            properties_data:res.data.properties_data,
                        },
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
                    group: null,
                },
                modal_properties:{
                    type:'properties',
                    isopen:false,
                    filter:"VP",
                    value:[]
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/groups/?limit=500`)
        .then(res => {
            this.setState({
                options_groups:res.data.results.map((group)=>{return {value:group.id,label:group.name}})
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
        this.props.history('/catalogs/availability_group/')
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
        let options = [], 
            value = null;
        switch(field){
            case "group":
                options = this.state.options_groups;
                value = options.find((option)=>option.value === this.state.data[field]);
                break;
        }
        return value;
    }

    render(){
        const { id,data,modal,options_groups, modal_properties } = this.state;
        const select_option_group = this.getOptionValue("group");
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={4}>
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
                        <Col sm={4}>
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
                                <Label>Grupo de grupo</Label>
                                <Select
                                    options={options_groups}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="group"
                                    value={select_option_group}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                {id?
                <AvailabilityList availability_group={id} />
                :<></>}
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <AvailabilityGroupForm {...props} params = {params} history={history} />;
}