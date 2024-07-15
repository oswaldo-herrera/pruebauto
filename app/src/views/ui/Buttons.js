import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardTitle,
  Row,
  Col,
} from "reactstrap";

const Buttons = () => {
  const [cSelected, setCSelected] = useState([]);
  const [rSelected, setRSelected] = useState(null);

  const onRadioBtnClick = (rSelected) => {
    setRSelected(rSelected);
  };

  const onCheckboxBtnClick = (selected) => {
    const index = cSelected.indexOf(selected);
    if (index < 0) {
      cSelected.push(selected);
    } else {
      cSelected.splice(index, 1);
    }
    setCSelected([...cSelected]);
  };

  return (
    <div>
      <Row>
        <Col xs="12" md="6">
          <Card>
            <CardTitle tag="h6" className="border-bottom p-3 mb-0">
              Servicios
            </CardTitle>
            <CardBody className="">
              <Link to={`/sale_page/`}>
                <Button className="btn" outline color="primary">
                  Venta de Servicios
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Col>
        <Col xs="12" md="6">
          {/* --------------------------------------------------------------------------------*/}
          {/* Card-2*/}
          {/* --------------------------------------------------------------------------------*/}
          <Card>
            <CardTitle tag="h6" className="border-bottom p-3 mb-0">
              Reservaciones
            </CardTitle>
            <CardBody className="">
              <Link to={`/reservation_page/create/`}>
                <Button className="btn" outline color="primary">
                  Reservacion por Clave OPERA
                </Button>
              </Link>
              
            </CardBody>
          </Card>
        </Col>
      </Row>
      {/* --------------------------------------------------------------------------------*/}
      {/* Row*/}
      {/* --------------------------------------------------------------------------------*/}

      {/* --------------------------------------------------------------------------------*/}
      {/* End Inner Div*/}
      {/* --------------------------------------------------------------------------------*/}
    </div>
  );
};

export default Buttons;
