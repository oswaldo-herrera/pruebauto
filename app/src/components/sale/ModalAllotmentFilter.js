import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalAllotmentFilter extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                start_date: "",
                due_date: "",
                availability_group: null,
                group: null,
                service: null,
            },
            property:null,
            options_services: [],
            options_availability_groups: [],
            options_groups: [],
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

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
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
		}
	}

	reset(data){
        let params = data.params!==undefined?data.params:this.state.params;
        let open = data.open!==undefined?data.open:this.state.open;
        this.setState({
            params: params,
            open: open,
        });
        this.options_load();
	}

    options_load(){
        axios.get(`${ApiUrl}general/services/?limit=500`)
        .then(res => {
            this.setState({
                options_services:res.data.results.map((service)=>{return {value:service.id,label:service.name}})
            });
        });
        axios.get(`${ApiUrl}general/availability_groups/?limit=500`)
        .then(res => {
            this.setState({
                options_availability_groups:res.data.results.map((availability_group)=>{return {value:availability_group.id,label:availability_group.name}})
            });
        });
        axios.get(`${ApiUrl}general/groups/?limit=500`)
        .then(res => {
            this.setState({
                options_groups:res.data.results.map((group)=>{return {value:group.id,label:group.name}})
            });
        });
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
		if(this.props.handleSave)
			this.props.handleSave(this.state.params);
	}

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "group":
                options = this.state.options_groups;
                value = options.find((option)=>option.value===this.state.params[field]);
                break;
            case "service":
                options = this.state.options_services;
                value = options.find((option)=>option.value===this.state.params[field]);
                break;
            case "availability_group":
                options = this.state.options_availability_groups;
                value = options.find((option)=>option.value===this.state.params[field]);
                break;
        }
        return value;
    }

	render(){
		const { params, open, options_services, options_availability_groups, options_groups } = this.state;
        const select_option_group = this.getOptionValue("group");
        const select_option_service = this.getOptionValue("service");
        const select_option_availability_group = this.getOptionValue("availability_group");
		return(
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}>
				<ModalHeader><div className="text-center">Filtros de bloqueo</div></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-form">
                        <Row>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label>
                                        Fecha inicio
                                    </Label>
                                    <Col>
                                        <Input type='date'
                                            name="start_date"
                                            placeholder="Fecha inicio"
                                            value={params.start_date}
                                            onChange={this.onChangeValue}
                                            />
                                    </Col>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label>
                                        Fecha fin
                                    </Label>
                                    <Col>
                                        <Input type='date'
                                            name="due_date"
                                            placeholder="Fecha fin"
                                            value={params.due_date}
                                            onChange={this.onChangeValue}
                                            />
                                    </Col>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label>Servicio</Label>
                                    <Select
                                        options={options_services}
                                        isClearable={true}
                                        isSearchable={true}
                                        name="service"
                                        value={select_option_service}
                                        onChange={this.onChangeSelectValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
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
                            <Col sm={6}>
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
                    </Form>
				</ModalBody>
				<ModalFooter>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='filter-form'>
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
    return <ModalAllotmentFilter {...props} history={history} />;
}