// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() pure internal returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() pure internal returns (G2Point memory) {
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) pure internal returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
    }


    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success);
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length);
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[1];
            input[i * 6 + 3] = p2[i].X[0];
            input[i * 6 + 4] = p2[i].Y[1];
            input[i * 6 + 5] = p2[i].Y[0];
        }
        uint[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x1fb772c2c7cff9d010ab57828828bec742fa9b6929a8c05cd69b1708fe673de5), uint256(0x104e39057734145a15ec7b4b9379329ed2526c7a8296e447bfb383568f74e21e));
        vk.beta = Pairing.G2Point([uint256(0x1ed1bc1febce7cce45ce3e7f405cebc1fd74df28cc9970a4790c74471bc83df1), uint256(0x2d5dcc923df21a724f6f98a2f8cc2b51f5f8ed359381670bd38b63f5ae5f4808)], [uint256(0x167e882f05645ef23176b4057f1b8a2c0940cbecd9433292b0ccac01b17d0559), uint256(0x25f5ec63294a85496462cdfbf003eaae702423f69d70610545359f637e395024)]);
        vk.gamma = Pairing.G2Point([uint256(0x18f43d9980124002f144770c5a9129c4c678389096fb38d472403d820ae8b910), uint256(0x037faf3608bba472b17ff83da749f81ed19cf576c1c6922d115c130a3774d275)], [uint256(0x187cc368b3f2ef6654d981ecc491d08dbf61344da02e6e130c84bb25f75ba197), uint256(0x26f200939aaa72104a755d9f65b63aec819de4f0d6861b0e11ceaa86486bd250)]);
        vk.delta = Pairing.G2Point([uint256(0x2d02fff8810f6e3efc2b95ca591bfcad09d7dab5808faf4b1d78c29d781bcc9e), uint256(0x164783233b608c9732722e48467213137b076a4dd7decbb68e86e1da4a7e9bb8)], [uint256(0x27a3165c14caef0c97c3622e37d2d847b198e9ec8cab09c416281af6802fd664), uint256(0x16a228a947e5fa4d937933d3785212e9b06b2d3a11e6be89a3e12252071fc9a7)]);
        vk.gamma_abc = new Pairing.G1Point[](7);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x1107e7091ccd180354a11ff7a58093efb986366a8d1deff27c5f42541560f44e), uint256(0x0b668b3c68fe49f00fc6505956a8ca4078a63e6ba1c666f97ac540797ff44e5e));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x2ed7474a463a6c998a918a7bcc214975a1a8668a860ad128968ec6bfa5bf50d2), uint256(0x0b09e8effed95153f6cb6032db469717d14963df9c133191fdf4c5dee39a309a));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x28e356fac7dcf6dc422ac0bf82a342f043bb1a4e48755863a7601b64d90c96c4), uint256(0x160e7cca51fc700727cc5e813f1aef4488646065cf657ce097b36a38b43eb655));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x1d08f1241956e2f5fd1abc35d7f4455d894d3eae44977d02eccb72a4d88b8266), uint256(0x2b4872e82aeab15279787e6e07afec543f29bf42a9a86aeaeaff8fef8c0ec73e));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x16f2cb72f6d0b28ecb8b7ab6d90a705b0ed72c0d8fb10fec60799b9066ae53a7), uint256(0x137f4a6b04fbb082fe672fee77d0fbd55935b8e84aec7b3d20d79a0d088af2a3));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x234f4beb113dcb6907f5e46860b0044ede89c93596d1fd696b049c69a8ba84b5), uint256(0x1466a24ce8aa77bdf1dd5fae2313aaaaec1c0f61c9adc3251167a807ff5fec6d));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x0cb8c97985e1c34c04cf397e8a6ae7847fca1abe76ac60cfb63c93fb447a6d8f), uint256(0x21ec6210e70b6c630f98a1f40eb1656ddcc8a23757b12f13c5425952734ab839));
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if(!Pairing.pairingProd4(
             proof.a, proof.b,
             Pairing.negate(vk_x), vk.gamma,
             Pairing.negate(proof.c), vk.delta,
             Pairing.negate(vk.alpha), vk.beta)) return 1;
        return 0;
    }
    function verifyTx(
            Proof memory proof, uint[6] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](6);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
