import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input, FormGroup, Label } from "reactstrap";
import { ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import ModalAllotmentFilter from './ModalAllotmentFilter';
import ModalAllotmentComments from './ModalAllotmentComments';
class AllotmentList extends Component{
    constructor(props){
        super(props);
        this.state={
            schedule_allotments:[],
            selected_all:false,
            params:{
                start_date: "",
                due_date: "",
                availability_group: null,
                group: null,
                service: null,
            },
            modal_filter:{
                params:{
                    start_date: "",
                    due_date: "",
                    availability_group: null,
                    group: null,
                    service: null,
                },
                open:false,
            },
            modal_properties:{
                type:'property',
                isopen:true,
                filter:"VP",
                value:null
            },
            modal_comments:{
                schedule_allotment:null,
                open:false
            }
        }
    }

    refreshAllotments(){
        axios.get(`${ApiSalesUrl}allotment_list/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                schedule_allotments:res.data.map((schedule_allotment)=>Object.assign(schedule_allotment,{'selected':false})),
                selected_all:false,
            });
        })
    };

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_comments: {
                    ...prev_State.modal_asigment,
                    schedule_allotments:[],
                    open:false,
                },
                modal_filter:{
                    ...prev_State.modal_filter,
                    open:false,
                }
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
                    params:{
                        ...prev_State.params,
                        property:value
                    },
                };
            }
        );
	}

    handleAllotmentFilter = () => {
        this.setState(function (prevState) {
            return {
                modal_filter:{
                    ...prevState.modal_filter,
                    open: true,
                    params:this.state.params
                }
            };
        });
	}

    handleSaveAllotmentFilter = (params) => {
        this.setState(function (prevState) {
            return {
                params:params,
                modal_filter:{
                    ...prevState.modal_filter,
                    open: false,
                    params:params
                }
            };
        },()=>{this.refreshAllotments()});
	}

    handleSaveScheduleAllotmentComments = (params) => {
        axios.patch(`${ApiSalesUrl}schedule_allotments/${params.id}/`,{
            comments:params.comments,
        }).then(res=>{
            this.setState(function (prevState) {
                return {
                    modal_comments:{
                        ...prevState.modal_comments,
                        open: false,
                        schedule_allotment:null
                    }
                };
            },()=>{this.refreshAllotments()});
        });
        
	}

    handleScheduleAllotmentComment = (schedule_allotment) => {
        this.setState(function (prevState) {
            return {
                modal_comments:{
                    ...prevState.modal_comments,
                    open: true,
                    schedule_allotment:schedule_allotment
                }
            };
        },()=>{this.refreshAllotments()});
	}

    onChangeSelectScheduleAllotment(data) {
        let schedule_allotments = this.state.schedule_allotments.filter((sa)=>sa.selected);
        axios.patch(`${ApiSalesUrl}allotment_list/`,{
            schedule_allotments:schedule_allotments.map((schedule_allotment)=>schedule_allotment.id),
            active:data,
        }).then(res=>{
            this.refreshAllotments();
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

    render(){
        const { schedule_allotments, selected_all, params, modal_properties, modal_comments, modal_filter } = this.state;
        return(
            <Row>
                
                <Col lg="4">
                    <ButtonGroup>
                        <Button size='sm'
                            color='primary'
                            onClick={(e)=> this.handleAllotmentFilter()}>
                            Buscar bloqueos <i className="bi bi-search"></i>
                        </Button>
                        <Button size='sm'
                            color='success'
                            disabled={schedule_allotments.length===0}
                            onClick={(e)=>this.refreshAllotments()}>
                            Actualizar <i className="bi bi-arrow-repeat"></i>
                        </Button>
                    </ButtonGroup>
                </Col>
                {schedule_allotments.length > 0?<>
                <Col lg="8">
                    <h5>Bloqueo del {moment(params.start_date).format('LL')} al {moment(params.due_date).format('LL')}</h5>
                </Col>
                <Col lg="8" className='my-2'>
                    <ButtonGroup>
                        <Button size='sm'
                            color='primary'
                            onClick={()=>{
                                this.onChangeSelectScheduleAllotment(true);
                            }}
                            disabled={schedule_allotments.find((sa)=>sa.selected)?false:true}>
                            <i className="bi bi-arrow-up-circle-fill"></i>  
                        </Button>
                        <Button size='sm'
                            color='primary'
                            onClick={()=>{
                                this.onChangeSelectScheduleAllotment(false);
                            }}
                            disabled={schedule_allotments.find((sa)=>sa.selected)?false:true}>
                            <i className="bi bi-arrow-down-circle-fill"></i>  
                        </Button>
                    </ButtonGroup>
                </Col>
                <Col lg="12">
                    <div className='table-scroll'>       
                        <div className='table-wrap'>
                            <Table size='sm' className="no-wrap align-middle" responsive bordered id="dataTable">
                                <thead>
                                    <tr>
                                        <th>
                                            <Input type="checkbox"
                                                name="selected"
                                                style={{fontSize:"15px"}}
                                                checked={selected_all}
                                                onChange={(event)=>{
                                                    let schedule_allotments = this.state.schedule_allotments.map((schedule_allotment)=>Object.assign(schedule_allotment,{selected:event.target.checked}));
                                                    this.setState({
                                                        schedule_allotments:schedule_allotments,
                                                        selected_all:event.target.checked
                                                    });
                                                }}/>
                                        </th>
                                        <th>Fecha</th>
                                        <th>Grupo</th>
                                        <th>Grupo de disponibilidad</th>
                                        <th>Hora</th>
                                        <th>Disponible</th>
                                        <th>Reservas</th>
                                        <th>¿Cerrado?</th>
                                        <th>Comentarios/Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule_allotments.map((schedule_allotment, index) => (
                                        <tr key={schedule_allotment.id}>
                                            <td>
                                                <Input type="checkbox"
                                                    name="selected"
                                                    style={{fontSize:"15px"}}
                                                    checked={schedule_allotment.selected}
                                                    onChange={(event)=>{
                                                        var schedule_allotment = this.state.schedule_allotments;
                                                        schedule_allotment[index].selected = event.target.checked;
                                                        this.setState({
                                                            schedule_allotments:schedule_allotments
                                                        });
                                                    }}/>
                                            </td>
                                            <td>{moment(schedule_allotment.start_date).format('DD/MM/YYYY')}</td>
                                            <td>{schedule_allotment.group_name}</td>
                                            <td>{schedule_allotment.availability_group_name}</td>
                                            <td>{moment(schedule_allotment.schedule_time, "HH:mm:ss").format('HH:mm')}</td>
                                            <td>{schedule_allotment.schedule_limit}</td>
                                            <td>{schedule_allotment.reserved}</td>
                                            <td>{schedule_allotment.active?"NO":"SI"}</td>
                                            <td>
                                                <Row>
                                                    <Col sm={3}>
                                                        <Button size='sm'
                                                            color='secondary'
                                                            onClick={()=>{
                                                                this.handleScheduleAllotmentComment(schedule_allotment);
                                                            }}>
                                                            <i className="bi bi-chat-dots-fill"></i>  
                                                        </Button>
                                                    </Col>
                                                    <Col sm={9}>
                                                        <p className='max-lines'>{schedule_allotment.comments}</p>
                                                    </Col>
                                                </Row>    
                                            </td>
                                        </tr>
                                    ))} 
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </Col>
                </>
                :<></>}
                <ModalPropertiesAsignment handleAsignment={this.handleAsignment} handleClose={this.handlePropertyClose} data={modal_properties} />
                <ModalAllotmentFilter handleClose={this.handleClose} handleSave={this.handleSaveAllotmentFilter} data={modal_filter}/>
                <ModalAllotmentComments handleClose={this.handleClose} handleSave={this.handleSaveScheduleAllotmentComments} data={modal_comments} />
            </Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <AllotmentList {...props} history={history} />;
}