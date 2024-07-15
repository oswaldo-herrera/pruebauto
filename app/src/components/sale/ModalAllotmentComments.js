import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalAllotmentComments extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            schedule_allotment:null
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				schedule_allotment: {
					...prevState.schedule_allotment,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    isDataChange(prev_data, new_data){
		if(prev_data.schedule_allotment !== new_data.schedule_allotment)
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
        let schedule_allotment = data.schedule_allotment!==undefined?data.schedule_allotment:this.state.schedule_allotment;
        let open = data.open!==undefined?data.open:this.state.open;
        this.setState({
            schedule_allotment: schedule_allotment,
            open: open,
        });
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
		if(this.props.handleSave)
			this.props.handleSave(this.state.schedule_allotment);
	}

	render(){
		const { schedule_allotment, open, } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='sm'
				keyboard={false}>
				<ModalHeader><div className="text-center">Filtros de bloqueo</div></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="comments-form">
                        <Row>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label for="comments" size='sm'>Comentarios</Label>
                                    <Input type="textarea" 
                                        name="comments"
                                        bsSize="sm" 
                                        placeholder="Comentarios" 
                                        value={schedule_allotment?schedule_allotment.comments:""}
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
						<Button color="success" type="submit" form='comments-form'>
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
    return <ModalAllotmentComments {...props} history={history} />;
}