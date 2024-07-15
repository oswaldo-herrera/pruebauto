import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalReservationFilter extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeMultiSelectValue = this.onChangeMultiSelectValue.bind(this);
        this.onChangeValueRadioType = this.onChangeValueRadioType.bind(this);
        this.onChangeValueRadioTypeFilter = this.onChangeValueRadioTypeFilter.bind(this);
        this.onChangeValueRadioFormat = this.onChangeValueRadioFormat.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                format:"download",
                type:"pdf",
                type_filter:"none",
                unit_check:false,
                unit:"",
                hotel_check:false,
                hotels:[],
                providers:[],
            },
            options_hotels: [],
            options_providers: [],
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

    onChangeMultiSelectValue(data, event) {
        let value = data?data.map((option)=>option.value):[];
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.name]:value,
                },
            };
        });
    }

    onChangeValueRadioType(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    type:event.target.value,
                },
            };
        });
    }

    onChangeValueRadioFormat(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    format:event.target.value,
                },
            };
        });
    }

    onChangeValueRadioTypeFilter(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:event.target.checked,
                },
            };
        });
    }

    onChangeValueProvider(event,i) {
        var provider = this.state.options_providers[i];
        var providers = this.state.params.providers;
        const index = providers.findIndex(object => object.id === provider.id);
        if(event.target.checked){
            if (index === -1) {
                providers.push(provider);
            }
        } else {
            if (index !== -1) {
                providers.splice(index, 1);
            }
        }
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    providers:providers,
                },
            };
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
        if(prev_data.options_hotels !== new_data.options_hotels)
			return true
        if(prev_data.options_providers !== new_data.options_providers)
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
		}
	}

	reset(data){
        let params = data.params!==undefined?data.params:this.state.params;
        let open = data.open!==undefined?data.open:this.state.open;
        let options_hotels = [],
            options_providers = [];
        if(data.options_hotels!==undefined){
            options_hotels = data.options_hotels.map((hotel)=>{return {value:hotel.id,label:hotel.name}});
        } else {
            options_hotels = this.state.options_hotels;
        }
        if(data.options_providers!==undefined){
            options_providers = data.options_providers;
        } else {
            options_providers = this.state.options_providers;
        }
        this.setState({
            params: params,
            open: open,
            options_hotels: options_hotels,
            options_providers: options_providers
        });
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
        if(this.state.params.format === "download" && this.props.handleSave)
            this.props.handleSave(this.state.params);
        else if (this.state.params.format === "email" && this.props.handleEmailProviders)
            this.props.handleEmailProviders(this.state.params);
	}

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "hotel":
                options = this.state.options_hotels;
                value = options.find((option)=>option.value===this.state.params[field]);
                break;
        }
        return value;
    }

    getMultipleOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "hotels":
                options = this.state.options_hotels;
                value = options.filter((option)=>this.state.params[field].includes(option.value));
                break;
        }
        return value;
    }

    providerChecked(option_provider){
        var provider = this.state.params.providers.find((provider)=>{
            return provider.id === option_provider.id
        })
        return provider !== undefined;
    }

    provider_component(option_provider,i){
        return(
        <Col sm={4}>
            <FormGroup check>
                <Input type="checkbox" 
                    name="provider"
                    onChange={(e)=>this.onChangeValueProvider(e,i)}
                    checked={this.providerChecked(option_provider)}/>
                <Label check>
                    {option_provider.name}
                </Label>
            </FormGroup>
        </Col>
        )
    }

	render(){
		const { params, open, options_hotels, options_providers } = this.state;
        const select_option_hotel = this.getMultipleOptionValue("hotels");
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
				keyboard={false}>
				<ModalHeader><h4 className="text-center">Filtros de reporte de operación</h4></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-form">
                        <Row className='border-bottom'>
                            <Col sm={4}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioFormat}>
                                    <legend>
                                        <h5>Acción</h5>
                                    </legend>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="format"
                                            value={'download'}
                                            checked={params.format=="download"}/>
                                            {' '}
                                        <Label check>
                                            Descargar reporte
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="format"
                                            value={'email'}
                                            checked={params.format=="email"}/>
                                            {' '}
                                        <Label check>
                                            Enviar a proveedores
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioType}>
                                    <legend>
                                        <h5>Formato</h5>
                                    </legend>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="type"
                                            value={'pdf'}
                                            checked={params.type=="pdf"}/>
                                            {' '}
                                        <Label check>
                                            PDF
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="type"
                                            value={'excel'}
                                            checked={params.type=="excel"}/>
                                            {' '}
                                        <Label check>
                                            Excel
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={5}>
                                <FormGroup check>
                                    <Input type="checkbox" 
                                        name="hotel_check"
                                        onChange={this.onChangeValueRadioTypeFilter}
                                        checked={params.hotel_check}/>
                                    <Label check>
                                        Hotel
                                    </Label>
                                </FormGroup>
                                <FormGroup>
                                    <Select
                                        isMulti
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        options={options_hotels}
                                        isClearable={true}
                                        isSearchable={true}
                                        name="hotels"
                                        value={select_option_hotel}
                                        onChange={this.onChangeMultiSelectValue}
                                        isDisabled={!params.hotel_check}
                                        />
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup check>
                                    <Input type="checkbox" 
                                        name="unit_check"
                                        onChange={this.onChangeValueRadioTypeFilter}
                                        checked={params.unit_check}/>
                                    <Label check>
                                        Unidad
                                    </Label>
                                </FormGroup>
                                <FormGroup>
                                    <Input type="text"
                                        name="unit"
                                        value={params.unit}
                                        onChange={this.onChangeValue}
                                        disabled={!params.unit_check}/>
                                </FormGroup>
                            </Col>
                        </Row>
                        {params.format=="email"?
                        <Row>
                            <Col sm={12}>
                                <Label>Proveedores</Label>
                            </Col>
                            {options_providers.map((option_provider, index)=>(
                                <>
                                    {this.provider_component(option_provider,index)}
                                </>
                            ))}
                        </Row>
                        :<></>}
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
    return <ModalReservationFilter {...props} history={history} />;
}