import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from "reactstrap";
import Select from 'react-select';
import { getProfile } from "../components/user/UserModel";
class ModalPropertiesAsigment extends Component{
	
    constructor(props){
        super(props);
		this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleAsignment = this.handleAsignment.bind(this);
        this.state={
            title: null,
            type: 'property',
            isopen: false,
            isopenonproperties: false,
            filter: null,
            value: null,
            properties_data:[],
            properties:[],
            options:[]
        }
        getProfile().then((result) =>{
            let properties = result.properties.map((property)=>{
                return {
                    value:property.id,
                    key:property.code,
                    label:property.name
                }
            });
            this.setState({
                properties:properties
            });
        });
    }

    onChangeSelectValue(data) {
        let value = null;
        if(this.state.type === "properties"){
            value = data?data.map((option)=>option.value):[];
        } else {
            value = data?data.value:data;
        }
        this.setState({
			value: value,
		});
    }

    isDataChange(prev_data, new_data){
		if(prev_data.type !== new_data.type)
			return true;
		if(prev_data.isopen !== new_data.isopen)
			return true;
        if(new_data.filter !== undefined && prev_data.filter !== new_data.filter)
			return true;
        if(prev_data.value !== new_data.value)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)||prevState.properties.length !== this.state.properties.length) {
			this.reset(this.props.data);
		}
	}

	reset(data){
        let title = this.state.title;
        let isopen = data.isopen!==undefined?data.isopen:this.state.isopen;
        let isopenonproperties = data.isopenonproperties!==undefined?data.isopenonproperties:this.state.isopenonproperties;
        let type = data.type!==undefined?data.type:this.state.type;
        let value = data.value?data.value:this.state.value;
        let properties_data = data.properties_data?data.properties_data:this.state.properties_data;
        let filter = data.filter!==undefined?data.filter:this.state.filter;
        let options = [], user_options = []
        if(filter!==null)
            user_options = this.state.properties.filter((property)=>property.key.includes(filter));
        else 
            user_options = this.state.properties;

        if(type === "property"){
            options = user_options;
            title = "Asignar propiedad al dato";
        } else if(type === "properties") {
            title = "Asignar propiedades al dato";
            Array.prototype.push.apply(options,user_options,properties_data); 
            options = this.mergeoptions(user_options,properties_data.map((property)=>{
                return {
                    value:property.id,
                    key:property.code,
                    label:property.name
                }
            }))
        }
        if(isopen === true && options.length > 1 && type === "properties" && isopenonproperties===false){
            value = options.map((option)=>option.value);
            isopen = false;
            if(this.props.handleAsignment)
			    this.props.handleAsignment(value);
        }
        if(isopen === true && options.length === 1){
            value = type === "property"?options[0].value:[options[0].value];
            isopen = false;
            if(this.props.handleAsignment)
			    this.props.handleAsignment(value);
        }
        if((value === null || Array.isArray(value))&&options.length > 0&&isopen===true){
            if(type === "property"){
                value = options[0].value
            } else if(type === "properties") {
                title = "Asignar propiedades al dato";
                value = properties_data.length > 0?properties_data.map((property)=>property.id):options.map((option)=>option.value)
            }
        }
        this.setState({
            title: title,
            isopen: isopen,
            filter: filter,
            options: options,
            type: type,
            value: value,
            properties_data:properties_data,
        });
	}

    getOptionValue(){
        let value = null;
        if(this.state.type === "properties"){
            value = this.state.options.filter((option)=>this.state.value.includes(option.value));
        } else {
            value = this.state.options.find((option)=>option.value === this.state.value);
        }
        return value;
    }

    getValue(){
        if(this.state.type === "properties"){
            return "Propiedades: " + this.state.properties_data.map((property)=>property.name);
        } else {
            let value = this.state.options.find((option)=>option.value === this.state.value);
            return value?"Propiedad:"+value.label:"Sin propiedad";
        }
    }

    handleClose = (event) => {
        this.setState({
            value: this.state.type === "properties"?[]:null,
        });
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	handleAsignment = (event) => {
        if(this.state.value !== null)
		    if(this.props.handleAsignment)
			    this.props.handleAsignment(this.state.value);
	}

    mergeoptions(user_options,data_options){
        let unmergeoptions = user_options.concat(data_options);
        // Filtra los elementos duplicados por ID
        let mergeoptions = unmergeoptions.reduce((accumulator, currentObject) => {
          // Verifica si ya existe un objeto con el mismo ID en el acumulador
          if (!accumulator.some(obj => obj.value === currentObject.value)) {
            // Si no existe, agrégalo al acumulador
            accumulator.push(currentObject);
          }
          return accumulator;
        }, []);
        return mergeoptions;
    }

	render(){
		const { title, isopen, type, options } = this.state;
        const select_option = this.getOptionValue();
		return(<>
			<Modal
				isOpen={isopen}
				backdrop="static"
				keyboard={false}>
				<ModalHeader><div className="text-center">Sistema de Operaciones y VP{title?": "+title:""}</div></ModalHeader>
				<ModalBody>
					{type==="property"?
                    <FormGroup>
                        <Label for="property">Propiedad</Label>
                        <Select
                            options={options}
                            isClearable={true}
                            isSearchable={true}
                            placeholder={"Propiedad"}
                            name="property"
                            value={select_option}
                            onChange={this.onChangeSelectValue}/>
                    </FormGroup>:<></>}
					{type==="properties"?
                    <FormGroup>
                        <Label for="properties">Propiedades</Label>
                        <Select
                            isMulti
                            className="basic-multi-select"
                            classNamePrefix="select"
                            options={options}
                            isClearable={true}
                            isSearchable={true}
                            placeholder={"Propiedades"}
                            name="properties"
                            value={select_option}
                            onChange={this.onChangeSelectValue}/>
                    </FormGroup>:<></>}
				</ModalBody>
				<ModalFooter>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" onClick={this.handleAsignment}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
            <div className='tooltip-property'>{isopen?"":this.getValue()}</div>
            </>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalPropertiesAsigment {...props} history={history} />;
}