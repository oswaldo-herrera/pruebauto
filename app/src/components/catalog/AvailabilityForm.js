import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, CardGroup, Card, CardBody, CardTitle, CardText} from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import SchedulePickUpList from './SchedulePickUpList';
class AvailabilityForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeValueSchedule = this.onChangeValueSchedule.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            clone: null,
            data:{
                start_date: "",
                due_date: "",
                availability_group:null,
                schedule_1:this.schedule_data(true),
                schedule_2:this.schedule_data(),
                schedule_3:this.schedule_data(),
                schedule_4:this.schedule_data(),
                schedule_5:this.schedule_data(),
                schedule_6:this.schedule_data(),
                schedule_7:this.schedule_data(),
            },
            schedule:null,
            schedule_title:"",
            modal:{
                title: "Tarifa",
                type: 'success',
                message: null,
            }
        }
    }

    schedule_data(active=false){
        return {
            id:null,
            active:active,
            limit:0,
            time:"",
            MON:false,
            TUE:false,
            WED:false,
            THU:false,
            FRI:false,
            SAT:false,
            SUN:false
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

    onChangeValueSchedule(event,schedule) {
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    [schedule]:{
                        ...prevState.data[schedule],
                        [event.target.name]:event.target.value,
                    }
                },
            };
        });
    }

    onChangeSwitchValue(event,schedule) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [schedule]:{
                        ...prevState.data[schedule],
                        [event.target.name]:event.target.checked,
                    }
				},
			};
		});
    }

    onClickPickUp(event,schedule,title) {
        let schedule_data = this.state.data[schedule]
		this.setState({
            schedule:schedule_data.id,
            schedule_title:title
        });
    }

    onSubmit(e){
        e.preventDefault();
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}sales/availabilities/${this.state.id}/`, this.state.data)
                .then(res => {
                    this.reset(res.data.availability.id);
                    console.log(res.data.unavailable_sales);
                    if(res.data.unavailable_sales.length > 0){
                        let text = "La disponibilidad guardada. \n Ventas sin disponibilidad:"
                        for (let index = 0; index < res.data.unavailable_sales.length; index++) {
                            let unavailable_sale = res.data.unavailable_sales[index]
                            text += "\n" + unavailable_sale.id.toString().padStart(8, '0') + "|" + unavailable_sale.name + "|"  + unavailable_sale.date + "|" + unavailable_sale.time
                        }
                        this.setState(function (prev_State) {
                            return {
                                modal: {
                                    ...prev_State.modal,
                                    type:"error",
                                    message: text,
                                },
                            };
                        });
                    } else {
                        this.setState(function (prev_State) {
                            return {
                                modal: {
                                    ...prev_State.modal,
                                    type:"success",
                                    message: "¡Actualización exitosa!",
                                },
                            };
                        });
                    }
                    
                }).catch(this.catchDateError);
        } else if(this.state.clone !== null){
            axios.put(`${ApiUrl}sales/availabilities_clone_from/${this.state.clone.id}/`, this.state.data)
                .then(res => {
                    this.reset(res.data.availability.id);
                    if(res.data.unavailable_sales.length > 0){
                        let text = "La disponibilidad guardada. \n Ventas sin disponibilidad:"
                        for (let index = 0; index < res.data.unavailable_sales.length; index++) {
                            let unavailable_sale = res.data.unavailable_sales[index]
                            text += "\n" + unavailable_sale.id.toString().padStart(8, '0') + "|" + unavailable_sale.name + "|"  + unavailable_sale.date + "|" + unavailable_sale.time
                        }
                        this.setState(function (prev_State) {
                            return {
                                modal: {
                                    ...prev_State.modal,
                                    type:"error",
                                    message: text,
                                },
                            };
                        });
                    } else {
                        this.setState(function (prev_State) {
                            return {
                                modal: {
                                    ...prev_State.modal,
                                    type:"success",
                                    message: "¡Actualización exitosa!",
                                },
                            };
                        });
                    }
                    
                }).catch(this.catchDateError);
        } else {
            axios.post(`${ApiUrl}sales/availabilities/`, this.state.data)
                .then(res => {
                    console.log(res.data.unavailable_sales);
                    if(res.data.unavailable_sales.length > 0){
                        let text = "La disponibilidad guardada. \n Ventas sin disponibilidad:"
                        for (let index = 0; index < res.data.unavailable_sales.length; index++) {
                            let unavailable_sale = res.data.unavailable_sales[index]
                            text += "\n" + unavailable_sale.toString().padStart(8, '0') + "|" + unavailable_sale.name + "|"  + unavailable_sale.date + "|" + unavailable_sale.time
                        }
                        this.setState(function (prev_State) {
                            return {
                                modal: {
                                    ...prev_State.modal,
                                    type:"error",
                                    message: text,
                                },
                            };
                        });
                    } else {
                        this.setState(function (prev_State) {
                            return {
                                modal: {
                                    ...prev_State.modal,
                                    type:"success",
                                    message: "¡Guardado exitoso!",
                                },
                            };
                        });
                    }
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
        let id = this.props.id?this.props.id:null;
        let clone = this.props.clone?this.props.clone:null;
        let availability_group = this.props.availability_group?this.props.availability_group:null;
        if(clone === null){
            this.reset(id);
        } else {
            this.resetclone(clone);
        }
        if (availability_group){
            this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        availability_group:availability_group,
                    },
                    schedule:null
                };
            });
        }
        
	}

	componentDidUpdate(prevProps, prevState) {
        if(this.props.id !== this.state.id){
			this.reset(this.props.id);
		} else if(this.props.clone !== this.state.clone){
            this.resetclone(this.props.clone);
        }
        if (this.props.availability_group !== this.state.data.availability_group) {
			this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        availability_group:this.props.availability_group,
                    },
                    schedule:null
                };
            });
		}
        console.log(this.state.data)
	}

    data_format(data){
        return{
            ...data,
            schedule_1:{
                ...data.schedule_1,
                active:true
            },
            schedule_2:data.schedule_2===null?this.schedule_data():{
                ...data.schedule_2,
            },
            schedule_3:data.schedule_3===null?this.schedule_data():{
                ...data.schedule_3,
            },
            schedule_4:data.schedule_4===null?this.schedule_data():{
                ...data.schedule_4,
            },
            schedule_5:data.schedule_5===null?this.schedule_data():{
                ...data.schedule_5,
            },
            schedule_6:data.schedule_6===null?this.schedule_data():{
                ...data.schedule_6,
            },
            schedule_7:data.schedule_7===null?this.schedule_data():{
                ...data.schedule_7,
            },
        }
    }

    reset(id){
        if(id !== null){
            axios.get(`${ApiUrl}sales/availabilities/${id}/`)
            .then(res => {
                this.setState({
                    id:id,
                    clone:null,
                    data:this.data_format(res.data),
                });
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:id,
                    clone:null,
                    data: {
                        ...prev_State.data,
                        start_date: "",
                        due_date: "",
                        schedule_1:this.schedule_data(true),
                        schedule_2:this.schedule_data(),
                        schedule_3:this.schedule_data(),
                        schedule_4:this.schedule_data(),
                        schedule_5:this.schedule_data(),
                        schedule_6:this.schedule_data(),
                        schedule_7:this.schedule_data(),
                    },
                };
            });
        }
    }

    resetclone(clone){
        if(clone !== null){
            this.setState({
                id:null,
                clone:clone,
                data:this.data_format(clone),
            });
        }
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

    schedule_component(schedule,title,name){
        return(
            <Card className='mx-1' 
                color="dark"
                outline>
                <CardBody>
                    <CardTitle>
                        {title}
                        <FormGroup switch className='mb-2'>
                            <Input type="switch"
                                name="active"
                                checked={schedule.active}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={name==="schedule_1"}/>
                        </FormGroup>
                    </CardTitle>
                    <CardText>
                        <FormGroup>
                            <Input type="number" 
                                name="limit"
                                placeholder="Limite" 
                                value={schedule.limit}
                                onChange={(e)=>{this.onChangeValueSchedule(e,name)}}
                                disabled={!schedule.active}
                                required={schedule.active}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="time" 
                                name="time"
                                placeholder="Hora" 
                                value={schedule.time}
                                onChange={(e)=>{this.onChangeValueSchedule(e,name)}}
                                disabled={!schedule.active}
                                required={schedule.active}/>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="MON"
                                checked={schedule.MON}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>LUN</Label>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="TUE"
                                checked={schedule.TUE}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>MAR</Label>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="WED"
                                checked={schedule.WED}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>MIE</Label>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="THU"
                                checked={schedule.THU}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>JUE</Label>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="FRI"
                                checked={schedule.FRI}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>VIE</Label>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="SAT"
                                checked={schedule.SAT}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>SAB</Label>
                        </FormGroup>
                        <FormGroup check>
                            <Input type="checkbox" 
                                name="SUN"
                                checked={schedule.SUN}
                                onChange={(e)=>{this.onChangeSwitchValue(e,name)}}
                                disabled={!schedule.active}
                                />
                            <Label check>DOM</Label>
                        </FormGroup>
                        <Button variant="primary" onClick={(e)=>{this.onClickPickUp(e,name,title)}} disabled={schedule.id === null&&!schedule.active}>
                            Pick Up
                        </Button>
                    </CardText>
                </CardBody>
            </Card>
        )
    }

    render(){
        const { data,clone,modal,schedule,schedule_title } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        {clone!==null?<Col lg={12}>
                            <h4>Corte de fecha</h4>
                        </Col>:<></>}
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Periodo de inicio</Label>
                                <Input type="date" 
                                    name="start_date"
                                    placeholder="Periodo de inicio" 
                                    value={data.start_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Periodo de fin</Label>
                                <Input type="date" 
                                    name="due_date"
                                    placeholder="Periodo de fin" 
                                    value={data.due_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}></Col>
                        <Col sm={12}>
                            <CardGroup>
                                {this.schedule_component(data.schedule_1,"Horario 1","schedule_1")}
                                {this.schedule_component(data.schedule_2,"Horario 2","schedule_2")}
                                {this.schedule_component(data.schedule_3,"Horario 3","schedule_3")}
                                {this.schedule_component(data.schedule_4,"Horario 4","schedule_4")}
                                {this.schedule_component(data.schedule_5,"Horario 5","schedule_5")}
                                {this.schedule_component(data.schedule_6,"Horario 6","schedule_6")}
                                {this.schedule_component(data.schedule_7,"Horario 7","schedule_7")}
                            </CardGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit" className='mt-3'>
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                {clone?<></>:
                <Row>
                    <Col sm={12}>
                        {schedule?
                        <SchedulePickUpList schedule={schedule} schedule_title={schedule_title} clone={clone} />
                        :<></>}
                    </Col>
                </Row>}
                <ModalAlert handleClose={this.handleClose} handleCloseError={this.handleCloseError} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <AvailabilityForm {...props} params = {params} history={history} />;
}