import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, InputGroup } from "reactstrap";
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl, ApiSalesUrl } from '../../constants/api/site';
class ModalReservationSaleAsignment extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSearchReservation = this.handleSearchReservation.bind(this);
        this.state={
            open:false,
            discount_key:"",
            property:null,
        }
    }

    onChangeValue(event) {
		this.setState({
			[event.target.name]:event.target.value,
		});
    }

    isDataChange(prev_data, new_data){
        if(prev_data.open !== new_data.open)
			return true;
		if(prev_data.property !== new_data.property)
			return true;
        if(prev_data.discount_key !== new_data.discount_key)
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
        let open = data.open!==undefined?data.open:this.state.open;
        let property = data.property!==undefined?data.property:this.state.property;
        let discount_key = data.discount_key!==undefined?data.discount_key:this.state.discount_key;
        this.setState({
            open: open,
            property: property,
            discount_key: discount_key
        });
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

    handleSearchReservation(){
        axios.get(`${ApiSalesUrl}discount_key_search/`,
            {
                params: {
                    discount_key:this.state.discount_key,
                    property:this.state.property
                }
            }
        ).then(res => {
            if(this.props.handleSave&&res.data.id!==null)
			    this.props.handleSave(res.data);
            else
                alert("Este no existe o no esta disponible")
        });
    }

	render(){
		const { open, discount_key, } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='sm'
				keyboard={false}>
				<ModalHeader><div className="text-center">Autorizacion de descuentos</div></ModalHeader>
				<ModalBody>
					<Form>
                        <Row>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label size='sm'>Clave descuento#</Label>
                                    <Input type="number"
                                        bsSize="sm"
                                        name="discount_key"
                                        value={discount_key}
                                        onChange={this.onChangeValue}/>
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
						<Button color="success" onClick={this.handleSearchReservation}>
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
    return <ModalReservationSaleAsignment {...props} history={history} />;
}